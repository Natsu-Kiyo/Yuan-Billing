-- 账单统计聚合函数：在数据库侧完成汇总，避免前端全量拉取账单
-- security invoker + RLS：函数内部查询自动受 bills / categories 的行级安全约束
-- 用法：select public.get_bill_stats('2026-10-01', '2026-10-31');
--       select public.get_bill_stats();  -- 全部数据

create or replace function public.get_bill_stats(
  p_start_date date default null,
  p_end_date date default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with filtered as (
    select
      b.type,
      b.amount,
      b.bill_date,
      coalesce(c.name, '未分类') as category_name,
      coalesce(c.color, '#6366f1') as category_color
    from public.bills b
    left join public.categories c on c.id = b.category_id
    where (p_start_date is null or b.bill_date >= p_start_date)
      and (p_end_date is null or b.bill_date <= p_end_date)
  ),
  totals as (
    select
      coalesce(sum(amount) filter (where type = 'expense'), 0)::numeric as total_expense,
      coalesce(sum(amount) filter (where type = 'income'), 0)::numeric as total_income,
      count(*)::int as bill_count,
      min(bill_date) as data_start_date,
      max(bill_date) as data_end_date
    from filtered
  ),
  expense_categories as (
    select category_name, category_color, sum(amount) as total
    from filtered
    where type = 'expense'
    group by category_name, category_color
  ),
  income_categories as (
    select category_name, category_color, sum(amount) as total
    from filtered
    where type = 'income'
    group by category_name, category_color
  ),
  monthly as (
    select
      to_char(bill_date, 'YYYY-MM') as month,
      coalesce(sum(amount) filter (where type = 'expense'), 0) as expense,
      coalesce(sum(amount) filter (where type = 'income'), 0) as income
    from filtered
    group by 1
  )
  select jsonb_build_object(
    'totalExpense', t.total_expense,
    'totalIncome', t.total_income,
    'balance', t.total_income - t.total_expense,
    'billCount', t.bill_count,
    'dataStartDate', t.data_start_date,
    'dataEndDate', t.data_end_date,
    'expenseByCategory', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('name', category_name, 'value', total, 'color', category_color)
          order by total desc
        )
        from expense_categories
      ),
      '[]'::jsonb
    ),
    'incomeByCategory', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('name', category_name, 'value', total, 'color', category_color)
          order by total desc
        )
        from income_categories
      ),
      '[]'::jsonb
    ),
    'monthlyTrend', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('month', month, 'expense', expense, 'income', income)
          order by month
        )
        from monthly
      ),
      '[]'::jsonb
    )
  )
  from totals t;
$$;

-- 仅允许登录用户调用（anon 无法执行）
revoke all on function public.get_bill_stats(date, date) from public;
grant execute on function public.get_bill_stats(date, date) to authenticated;
