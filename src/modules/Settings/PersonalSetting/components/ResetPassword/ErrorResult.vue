<template>
  <div class="flex column items-center">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" class="checkmark">
      <circle cx="26" cy="26" r="25" fill="none" class="checkmark__circle checkmark__cross" />
      <path fill="none" d="M 12,12 L 40,40 M 40,12 L 12,40" class="checkmark__check" />
    </svg>
    <QChip square color="red-1" text-color="red-6" class="text-center">
      <span class="description">عملیات با شکست مواجه شد</span>
    </QChip>
  </div>
</template>
<style scoped lang="scss">
.checkmark__circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 2;
  stroke-miterlimit: 10;
  stroke: $error;
  fill: none;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.checkmark {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: block;
  stroke-width: 2;
  stroke: #fff;
  stroke-miterlimit: 10;
  margin: 10% auto;
  box-shadow: inset 0px 0px 0px $error;
  animation:
    fill 0.4s ease-in-out 0.4s forwards,
    scale 0.3s ease-in-out 0.9s both;
}

.checkmark__check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

.checkmark__cross {
  stroke: $error;
  fill: $error;
}

.description {
  font-size: 1.1rem;
}

@keyframes stroke {
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes scale {
  0%,
  100% {
    transform: none;
  }
  50% {
    transform: scale3d(1.1, 1.1, 1);
  }
}

@keyframes fill {
  100% {
    box-shadow: inset 0px 0px 0px 30px $error;
  }
}
</style>
