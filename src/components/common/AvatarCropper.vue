<template>
  <Teleport to="body">
    <div v-if="visible" class="cropper-overlay" @click.self="handleCancel">
      <div class="cropper-dialog">
        <div class="cropper-header">
          <h3 class="cropper-title">裁剪头像</h3>
          <button class="cropper-close" @click="handleCancel">&times;</button>
        </div>

        <div class="cropper-body">
          <div class="cropper-main">
            <div
              class="image-container"
              ref="containerRef"
              @mousedown="onMouseDown"
              @mousemove="onMouseMove"
              @mouseup="onMouseUp"
              @mouseleave="onMouseUp"
              @touchstart.prevent="onTouchStart"
              @touchmove.prevent="onTouchMove"
              @touchend="onTouchEnd"
            >
              <img :src="imageSrc" ref="imageRef" class="source-image" @load="onImageLoad" />
              <div
                v-if="ready"
                class="crop-box"
                :style="cropBoxStyle"
                @mousedown.stop="onCropMouseDown"
                @touchstart.stop.prevent="onCropTouchStart"
              >
                <div class="crop-grid"></div>
                <div
                  v-for="h in handles"
                  :key="h"
                  :class="['crop-handle', 'crop-handle-' + h]"
                  @mousedown.stop="onHandleMouseDown($event, h)"
                  @touchstart.stop.prevent="onHandleTouchStart($event, h)"
                ></div>
              </div>
            </div>
          </div>

          <div class="cropper-preview">
            <p class="preview-label">预览</p>
            <div class="preview-circle">
              <canvas ref="previewCanvasRef" :width="previewSize" :height="previewSize"></canvas>
            </div>
            <p class="preview-hint">拖动裁剪框调整范围</p>
          </div>
        </div>

        <div class="cropper-footer">
          <button class="btn-cancel" @click="handleCancel">取消</button>
          <button class="btn-confirm" @click="handleConfirm">确认</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  file: { type: File, default: null },
})

const emit = defineEmits(['update:visible', 'cropped'])

const handles = ['tl', 'tr', 'bl', 'br']
const previewSize = 120

const containerRef = ref(null)
const imageRef = ref(null)
const previewCanvasRef = ref(null)

const ready = ref(false)
const imageSrc = ref('')

const imageNaturalWidth = ref(0)
const imageNaturalHeight = ref(0)
const renderedWidth = ref(0)
const renderedHeight = ref(0)
const offsetX = ref(0)
const offsetY = ref(0)

const cropX = ref(0)
const cropY = ref(0)
const cropSize = ref(100)

const dragging = ref(false)
const resizing = ref(false)
const resizeHandle = ref(null)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragStartCropX = ref(0)
const dragStartCropY = ref(0)
const dragStartCropSize = ref(0)

const minCropSize = 40

const cropBoxStyle = computed(() => ({
  left: cropX.value + 'px',
  top: cropY.value + 'px',
  width: cropSize.value + 'px',
  height: cropSize.value + 'px',
}))

watch(
  () => props.visible,
  (val) => {
    if (val && props.file) {
      loadImage(props.file)
    }
  },
)

watch(
  [cropX, cropY, cropSize],
  () => {
    if (ready.value) {
      nextTick(updatePreview)
    }
  },
  { flush: 'post' },
)

function loadImage(file) {
  ready.value = false
  const reader = new FileReader()
  reader.onload = (e) => {
    imageSrc.value = e.target.result
  }
  reader.readAsDataURL(file)
}

function onImageLoad() {
  computeRenderedRect()
  initCropArea()
  ready.value = true
  nextTick(updatePreview)
}

function computeRenderedRect() {
  const container = containerRef.value
  const img = imageRef.value
  if (!container || !img) return

  const cw = container.clientWidth
  const ch = container.clientHeight
  const iw = img.naturalWidth
  const ih = img.naturalHeight

  imageNaturalWidth.value = iw
  imageNaturalHeight.value = ih

  const containerRatio = cw / ch
  const imageRatio = iw / ih

  if (imageRatio > containerRatio) {
    renderedWidth.value = cw
    renderedHeight.value = cw / imageRatio
    offsetX.value = 0
    offsetY.value = (ch - renderedHeight.value) / 2
  } else {
    renderedHeight.value = ch
    renderedWidth.value = ch * imageRatio
    offsetX.value = (cw - renderedWidth.value) / 2
    offsetY.value = 0
  }
}

function initCropArea() {
  const size = Math.min(renderedWidth.value, renderedHeight.value) * 0.65
  cropSize.value = Math.max(minCropSize, size)
  cropX.value = offsetX.value + (renderedWidth.value - cropSize.value) / 2
  cropY.value = offsetY.value + (renderedHeight.value - cropSize.value) / 2
}

function clampCrop() {
  const minX = offsetX.value
  const minY = offsetY.value
  const maxX = offsetX.value + renderedWidth.value - cropSize.value
  const maxY = offsetY.value + renderedHeight.value - cropSize.value
  const maxSizeX = renderedWidth.value
  const maxSizeY = renderedHeight.value

  if (cropSize.value < minCropSize) cropSize.value = minCropSize
  if (cropSize.value > maxSizeX) cropSize.value = maxSizeX
  if (cropSize.value > maxSizeY) cropSize.value = maxSizeY

  if (cropX.value < minX) cropX.value = minX
  if (cropY.value < minY) cropY.value = minY
  if (cropX.value > maxX) cropX.value = maxX
  if (cropY.value > maxY) cropY.value = maxY
}

function applyResize(dx, dy) {
  const handle = resizeHandle.value
  const startSize = dragStartCropSize.value
  const startX = dragStartCropX.value
  const startY = dragStartCropY.value

  let sizeDelta
  if (handle === 'br') sizeDelta = Math.max(dx, dy)
  else if (handle === 'tl') sizeDelta = Math.max(-dx, -dy)
  else if (handle === 'tr') sizeDelta = Math.max(dx, -dy)
  else sizeDelta = Math.max(-dx, dy)

  let newSize = startSize + sizeDelta
  if (newSize < minCropSize) newSize = minCropSize

  let maxW, maxH
  if (handle === 'br') {
    maxW = offsetX.value + renderedWidth.value - startX
    maxH = offsetY.value + renderedHeight.value - startY
  } else if (handle === 'tl') {
    maxW = startX + startSize - offsetX.value
    maxH = startY + startSize - offsetY.value
  } else if (handle === 'tr') {
    maxW = offsetX.value + renderedWidth.value - startX
    maxH = startY + startSize - offsetY.value
  } else {
    maxW = startX + startSize - offsetX.value
    maxH = offsetY.value + renderedHeight.value - startY
  }

  const maxPossible = Math.min(maxW, maxH)
  if (newSize > maxPossible) newSize = maxPossible

  cropSize.value = newSize

  if (handle === 'br') {
    cropX.value = startX
    cropY.value = startY
  } else if (handle === 'tl') {
    cropX.value = startX + startSize - newSize
    cropY.value = startY + startSize - newSize
  } else if (handle === 'tr') {
    cropX.value = startX
    cropY.value = startY + startSize - newSize
  } else {
    cropX.value = startX + startSize - newSize
    cropY.value = startY
  }

  clampCrop()
}

function updatePreview() {
  const canvas = previewCanvasRef.value
  const img = imageRef.value
  if (!canvas || !img) return

  const ctx = canvas.getContext('2d')
  const scale = imageNaturalWidth.value / renderedWidth.value
  const sx = Math.round((cropX.value - offsetX.value) * scale)
  const sy = Math.round((cropY.value - offsetY.value) * scale)
  const sSize = Math.round(cropSize.value * scale)

  ctx.clearRect(0, 0, previewSize, previewSize)

  ctx.save()
  ctx.beginPath()
  ctx.arc(previewSize / 2, previewSize / 2, previewSize / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, previewSize, previewSize)
  ctx.restore()
}

function getEventPos(e) {
  const container = containerRef.value
  const rect = container.getBoundingClientRect()
  if (e.touches) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    }
  }
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }
}

function isInsideCrop(pos) {
  return (
    pos.x >= cropX.value &&
    pos.x <= cropX.value + cropSize.value &&
    pos.y >= cropY.value &&
    pos.y <= cropY.value + cropSize.value
  )
}

function isInsideImage(pos) {
  return (
    pos.x >= offsetX.value &&
    pos.x <= offsetX.value + renderedWidth.value &&
    pos.y >= offsetY.value &&
    pos.y <= offsetY.value + renderedHeight.value
  )
}

function onMouseDown(e) {
  if (e.target !== containerRef.value) return
  const pos = getEventPos(e)
  if (!isInsideImage(pos)) return

  resizeHandle.value = null
  dragStartX.value = pos.x
  dragStartY.value = pos.y

  if (isInsideCrop(pos)) {
    dragging.value = true
    dragStartCropX.value = cropX.value
    dragStartCropY.value = cropY.value
  } else {
    resizing.value = true
    dragStartCropX.value = cropX.value
    dragStartCropY.value = cropY.value
    dragStartCropSize.value = cropSize.value
  }
}

function onMouseMove(e) {
  if (!dragging.value && !resizing.value) return
  const pos = getEventPos(e)
  const dx = pos.x - dragStartX.value
  const dy = pos.y - dragStartY.value

  if (dragging.value) {
    cropX.value = dragStartCropX.value + dx
    cropY.value = dragStartCropY.value + dy
    clampCrop()
  } else if (resizing.value) {
    applyResize(dx, dy)
  }
}

function onMouseUp() {
  dragging.value = false
  resizing.value = false
  resizeHandle.value = null
}

function onCropMouseDown(e) {
  dragging.value = true
  resizing.value = false
  resizeHandle.value = null
  const pos = getEventPos(e)
  dragStartX.value = pos.x
  dragStartY.value = pos.y
  dragStartCropX.value = cropX.value
  dragStartCropY.value = cropY.value
}

function onHandleMouseDown(e, handle) {
  resizing.value = true
  dragging.value = false
  resizeHandle.value = handle
  const pos = getEventPos(e)
  dragStartX.value = pos.x
  dragStartY.value = pos.y
  dragStartCropX.value = cropX.value
  dragStartCropY.value = cropY.value
  dragStartCropSize.value = cropSize.value
}

function onTouchStart(e) {
  if (e.target !== containerRef.value) return
  const pos = getEventPos(e)
  if (!isInsideImage(pos)) return

  resizeHandle.value = null
  dragStartX.value = pos.x
  dragStartY.value = pos.y

  if (isInsideCrop(pos)) {
    dragging.value = true
    dragStartCropX.value = cropX.value
    dragStartCropY.value = cropY.value
  } else {
    resizing.value = true
    dragStartCropX.value = cropX.value
    dragStartCropY.value = cropY.value
    dragStartCropSize.value = cropSize.value
  }
}

function onTouchMove(e) {
  if (!dragging.value && !resizing.value) return
  const pos = getEventPos(e)
  const dx = pos.x - dragStartX.value
  const dy = pos.y - dragStartY.value

  if (dragging.value) {
    cropX.value = dragStartCropX.value + dx
    cropY.value = dragStartCropY.value + dy
    clampCrop()
  } else if (resizing.value) {
    applyResize(dx, dy)
  }
}

function onTouchEnd() {
  dragging.value = false
  resizing.value = false
  resizeHandle.value = null
}

function onCropTouchStart(e) {
  dragging.value = true
  resizing.value = false
  resizeHandle.value = null
  const pos = getEventPos(e)
  dragStartX.value = pos.x
  dragStartY.value = pos.y
  dragStartCropX.value = cropX.value
  dragStartCropY.value = cropY.value
}

function onHandleTouchStart(e, handle) {
  resizing.value = true
  dragging.value = false
  resizeHandle.value = handle
  const pos = getEventPos(e)
  dragStartX.value = pos.x
  dragStartY.value = pos.y
  dragStartCropX.value = cropX.value
  dragStartCropY.value = cropY.value
  dragStartCropSize.value = cropSize.value
}

function handleCancel() {
  emit('update:visible', false)
}

function handleConfirm() {
  const img = imageRef.value
  if (!img) return

  const canvas = document.createElement('canvas')
  const scale = imageNaturalWidth.value / renderedWidth.value
  const sx = Math.round((cropX.value - offsetX.value) * scale)
  const sy = Math.round((cropY.value - offsetY.value) * scale)
  const sSize = Math.round(cropSize.value * scale)

  canvas.width = sSize
  canvas.height = sSize

  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, sSize, sSize)

  canvas.toBlob((blob) => {
    if (!blob) {
      emit('update:visible', false)
      return
    }
    const file = new File([blob], 'avatar.png', { type: 'image/png' })
    emit('cropped', file)
    emit('update:visible', false)
  }, 'image/png')
}
</script>

<style lang="less" scoped>
.cropper-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
}

.cropper-dialog {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.cropper-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.cropper-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.cropper-close {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--color-text-tertiary);
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }
}

.cropper-body {
  display: flex;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
  flex: 1;
  min-height: 0;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: center;
  }
}

.cropper-main {
  flex: 1;
  min-width: 0;
  min-height: 300px;
}

.image-container {
  position: relative;
  width: 100%;
  height: 380px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

.source-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.crop-box {
  position: absolute;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55);
  border: 2px solid #fff;
  cursor: move;
  transition: none;
}

.crop-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to bottom, rgba(255, 255, 255, 0.35) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.35) 1px, transparent 1px),
    linear-gradient(to right, rgba(255, 255, 255, 0.35) 1px, transparent 1px),
    linear-gradient(to right, rgba(255, 255, 255, 0.35) 1px, transparent 1px);
  background-position:
    0 33.33%,
    0 66.66%,
    33.33% 0,
    66.66% 0;
  background-size:
    100% 1px,
    100% 1px,
    1px 100%,
    1px 100%;
  background-repeat: no-repeat;
}

.crop-handle {
  position: absolute;
  width: 16px;
  height: 16px;
  background: #fff;
  border: 2px solid var(--el-color-primary, #409eff);
  border-radius: 2px;
  z-index: 1;
}

.crop-handle-tl {
  top: -8px;
  left: -8px;
  cursor: nw-resize;
}

.crop-handle-tr {
  top: -8px;
  right: -8px;
  cursor: ne-resize;
}

.crop-handle-bl {
  bottom: -8px;
  left: -8px;
  cursor: sw-resize;
}

.crop-handle-br {
  bottom: -8px;
  right: -8px;
  cursor: se-resize;
}

.cropper-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  flex-shrink: 0;
  padding-top: var(--spacing-md);

  @media (max-width: 640px) {
    padding-top: 0;
  }
}

.preview-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  margin: 0;
}

.preview-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--color-border);
  flex-shrink: 0;

  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
}

.preview-hint {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin: 0;
  text-align: center;
}

.cropper-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  padding: var(--spacing-lg) var(--spacing-xl);
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.btn-cancel {
  padding: 8px 24px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }
}

.btn-confirm {
  padding: 8px 24px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: #fff;
  background: var(--el-color-primary, #409eff);
  transition: all var(--transition-fast);

  &:hover {
    opacity: 0.85;
  }
}
</style>
