/**
 * Three.js 场景资源管理 composable
 *
 * 统一封装 Three.js 组件的常见资源管理模式：
 * - WebGL 能力检测（自动释放测试上下文）
 * - scene/camera/renderer/controls 生命周期管理
 * - ResizeObserver + handleResize
 * - animationFrame 跟踪与取消
 * - setTimeout 跟踪与清理
 * - geometry/material 深度释放
 * - webglcontextlost 事件处理
 *
 * 用法：
 *   const { checkWebGLSupport, registerRenderer, registerScene, registerControls,
 *           trackAnimation, trackTimer, onCleanup } = useThreeScene()
 *   onCleanup(() => { /* 自定义清理 *\/ })
 */

import { onBeforeUnmount } from 'vue'
import * as THREE from 'three'

type CleanupFn = () => void

export function useThreeScene() {
  const animationIds = new Set<number>()
  const timerIds = new Set<number>()
  const cleanupFns: CleanupFn[] = []
  const registeredRenderers: THREE.WebGLRenderer[] = []
  const registeredScenes: THREE.Scene[] = []
  const registeredControls: { dispose: () => void }[] = []
  const resizeObservers: ResizeObserver[] = []
  const listeners: { target: EventTarget; type: string; handler: EventListenerOrEventListenerObject }[] = []

  /**
   * 检测浏览器是否支持 WebGL2 或 WebGL1。
   * 测试用的上下文会立即通过 WEBGL_lose_context 扩展释放，避免上下文泄漏。
   */
  function checkWebGLSupport(): { supported: boolean; version: 'webgl2' | 'webgl' | null } {
    const testCanvas = document.createElement('canvas')
    const gl2 = testCanvas.getContext('webgl2') as WebGL2RenderingContext | null
    if (gl2) {
      const loseExt = gl2.getExtension('WEBGL_lose_context')
      loseExt?.loseContext()
      return { supported: true, version: 'webgl2' }
    }
    const gl1 = testCanvas.getContext('webgl') as WebGLRenderingContext | null
    if (gl1) {
      const loseExt = gl1.getExtension('WEBGL_lose_context')
      loseExt?.loseContext()
      return { supported: true, version: 'webgl' }
    }
    return { supported: false, version: null }
  }

  function registerRenderer(r: THREE.WebGLRenderer) {
    registeredRenderers.push(r)
    // 监听上下文丢失事件
    const onContextLost = (e: Event) => {
      e.preventDefault()
      console.warn('[useThreeScene] WebGL context lost')
    }
    r.domElement.addEventListener('webglcontextlost', onContextLost as EventListener)
    listeners.push({ target: r.domElement, type: 'webglcontextlost', handler: onContextLost as EventListener })
  }

  function registerScene(s: THREE.Scene) {
    registeredScenes.push(s)
  }

  function registerControls(c: { dispose: () => void }) {
    registeredControls.push(c)
  }

  function registerResizeObserver(ro: ResizeObserver) {
    resizeObservers.push(ro)
  }

  /**
   * 跟踪 animationFrame，卸载时自动取消
   */
  function trackAnimation(id: number) {
    animationIds.add(id)
    return id
  }

  function untrackAnimation(id: number) {
    animationIds.delete(id)
  }

  /**
   * 跟踪 setTimeout，卸载时自动清理
   */
  function trackTimer(fn: () => void, delay: number): number {
    const id = window.setTimeout(() => {
      timerIds.delete(id)
      fn()
    }, delay)
    timerIds.add(id)
    return id
  }

  function clearTrackedTimer(id: number) {
    clearTimeout(id)
    timerIds.delete(id)
  }

  /**
   * 注册事件监听器，卸载时自动移除
   */
  function addTrackedListener(
    target: EventTarget,
    type: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    target.addEventListener(type, handler, options)
    listeners.push({ target, type, handler })
  }

  /**
   * 释放场景中的所有 geometry 和 material
   */
  function disposeScene(scene: THREE.Scene) {
    scene.traverse(obj => {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mt => mt.dispose())
        } else {
          ;(mesh.material as THREE.Material).dispose()
        }
      }
    })
  }

  /**
   * 注册自定义清理函数，在 onBeforeUnmount 时执行
   */
  function onCleanup(fn: CleanupFn) {
    cleanupFns.push(fn)
  }

  onBeforeUnmount(() => {
    // 1. 取消所有 animationFrame
    animationIds.forEach(id => cancelAnimationFrame(id))
    animationIds.clear()

    // 2. 清理所有定时器
    timerIds.forEach(id => clearTimeout(id))
    timerIds.clear()

    // 3. 断开所有 ResizeObserver
    resizeObservers.forEach(ro => ro.disconnect())
    resizeObservers.length = 0

    // 4. 移除所有事件监听器
    listeners.forEach(({ target, type, handler }) => {
      target.removeEventListener(type, handler)
    })
    listeners.length = 0

    // 5. 释放 OrbitControls
    registeredControls.forEach(c => {
      try {
        c.dispose()
      } catch (e) {
        // 忽略 dispose 错误
      }
    })
    registeredControls.length = 0

    // 6. 释放场景中的 geometry 和 material
    registeredScenes.forEach(s => disposeScene(s))
    registeredScenes.length = 0

    // 7. 释放渲染器并强制丢失上下文
    registeredRenderers.forEach(r => {
      try {
        r.dispose()
        r.forceContextLoss()
        if (r.domElement.parentNode) {
          r.domElement.parentNode.removeChild(r.domElement)
        }
      } catch (e) {
        // 忽略 dispose 错误
      }
    })
    registeredRenderers.length = 0

    // 8. 执行自定义清理
    cleanupFns.forEach(fn => {
      try {
        fn()
      } catch (e) {
        // 忽略清理错误
      }
    })
    cleanupFns.length = 0
  })

  return {
    checkWebGLSupport,
    registerRenderer,
    registerScene,
    registerControls,
    registerResizeObserver,
    trackAnimation,
    untrackAnimation,
    trackTimer,
    clearTrackedTimer,
    addTrackedListener,
    disposeScene,
    onCleanup
  }
}
