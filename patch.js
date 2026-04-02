let lenis = null;

function initLenisScroll() {
    if (typeof Lenis === 'undefined') {
        console.log("📱 Lenis not loaded (using native scroll)");
        return null;
    }

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 768;
    if (isTouchDevice) {
        document.documentElement.style.scrollBehavior = 'smooth';
        console.log("📱 Lenis disabled for touch devices (using native scroll)");
        return null;
    }

    lenis = new Lenis({
