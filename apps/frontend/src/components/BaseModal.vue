<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    titleId?: string
  }>(),
  {
    titleId: undefined,
  },
)

const emit = defineEmits<{
  close: []
}>()

function closeModal() {
  emit('close')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.isOpen) {
    closeModal()
  }
}

watch(
  () => props.isOpen,
  (isOpen) => {
    document.body.classList.toggle('modal-open', isOpen)
  },
)

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.classList.remove('modal-open')
})
</script>

<template>
  <Teleport to="body">
    <Transition name="base-modal">
      <div v-if="isOpen" class="base-modal" role="presentation" @click.self="closeModal">
        <button
          type="button"
          class="base-modal__backdrop"
          aria-label="Закрыть модальное окно"
          @click="closeModal"
        />

        <section
          class="base-modal__panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          @click.stop
        >
          <button type="button" class="base-modal__close" aria-label="Закрыть" @click="closeModal">
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
          <slot />
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
:global(body.modal-open) {
  overflow: hidden;
}

.base-modal {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: end center;
  padding: 18px;
}

.base-modal__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgb(var(--brand-dark-rgb) / 0.46);
  cursor: pointer;
}

.base-modal__panel {
  position: relative;
  z-index: 1;
  overflow: hidden;
  width: min(620px, 100%);
  max-height: calc(100vh - 36px);
  border: 1px solid rgb(var(--cream-rgb) / 0.3);
  border-radius: 8px;
  background: var(--white);
  box-shadow: 0 28px 70px rgb(var(--brand-dark-rgb) / 0.28);
}

.base-modal__close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  display: inline-grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  background: rgb(var(--white-rgb) / 0.86);
  transition:
    border-color 180ms ease,
    background-color 180ms ease;
}

.base-modal__close span {
  grid-area: 1 / 1;
  width: 14px;
  height: 1.5px;
  border-radius: 999px;
  background: var(--brand-dark);
}

.base-modal__close span:first-child {
  transform: rotate(45deg);
}

.base-modal__close span:last-child {
  transform: rotate(-45deg);
}

.base-modal__close:hover,
.base-modal__close:focus-visible {
  border-color: rgb(var(--brand-lime-rgb) / 0.36);
  background: var(--white);
}

.base-modal-enter-active,
.base-modal-leave-active {
  transition: opacity 180ms ease;
}

.base-modal-enter-active .base-modal__panel,
.base-modal-leave-active .base-modal__panel {
  transition: transform 180ms ease;
}

.base-modal-enter-from,
.base-modal-leave-to {
  opacity: 0;
}

.base-modal-enter-from .base-modal__panel,
.base-modal-leave-to .base-modal__panel {
  transform: translateY(18px);
}

@media (min-width: 640px) {
  .base-modal {
    place-items: center;
    padding: 24px;
  }

  .base-modal__panel {
    max-height: calc(100vh - 48px);
  }
}
</style>
