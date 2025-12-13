
document.addEventListener('DOMContentLoaded', async () => {
    const sliderContainer = document.getElementById('slider-container');
    const dotsContainer = document.getElementById('slider-dots');
    const prevBtn = document.getElementById('slider-prev');
    const nextBtn = document.getElementById('slider-next');
    const arrowsContainer = document.getElementById('slider-arrows');

    // Configuration
    const imageFolder = 'imagefiles/';

    let images = [];
    let currentIndex = 0;

    // Helper to check if image exists
    function checkImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    }

    // Function to add a single slide (Incremental Loading)
    function addSlide(src, index) {
        // Create Slide
        const slide = document.createElement('div');
        slide.classList.add('slide');
        slide.style.position = 'absolute';
        slide.style.top = '0';
        slide.style.left = '0';
        slide.style.width = '100%';
        slide.style.height = '100%';
        // Start invisible for fade-in
        slide.style.opacity = '0';
        slide.style.transition = 'opacity 0.5s ease-in-out';
        slide.style.display = 'flex';
        slide.style.alignItems = 'center';
        slide.style.justifyContent = 'center';
        slide.style.overflow = 'hidden';

        // Blurred Background
        const startBg = document.createElement('div');
        startBg.style.position = 'absolute';
        startBg.style.top = '0';
        startBg.style.left = '0';
        startBg.style.width = '100%';
        startBg.style.height = '100%';
        startBg.style.backgroundImage = `url('${src}')`;
        startBg.style.backgroundSize = 'cover';
        startBg.style.backgroundPosition = 'center';
        startBg.style.filter = 'blur(20px)';
        startBg.style.zIndex = '1';
        startBg.style.transform = 'scale(1.1)';
        slide.appendChild(startBg);

        // Main Image
        const img = document.createElement('img');
        img.src = src;
        img.style.position = 'relative';
        img.style.zIndex = '2';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';
        img.style.width = 'auto';
        img.style.height = 'auto';
        img.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
        slide.appendChild(img);

        sliderContainer.appendChild(slide);

        // Create Dot
        const dot = document.createElement('button');
        dot.className = 'c135 c90 c71'; // Default inactive
        dot.type = 'button';
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
        dotsContainer.appendChild(dot);

        // If this is the first slide, show it immediately with fade-in
        if (index === 0) {
            // Force reflow to ensure transition plays
            void slide.offsetWidth;
            slide.style.opacity = '1';
            slide.style.zIndex = '10';
            dot.className = 'c135 c90 c83'; // Active dot
        }
    }

    // Scan for images (Streaming)
    async function loadImages() {
        // Clear containers only once at start (already empty in HTML, but good practice)
        sliderContainer.innerHTML = '';
        dotsContainer.innerHTML = '';

        let i = 1;
        let consecutiveFailures = 0;
        const maxFailures = 2;

        while (consecutiveFailures < maxFailures) {
            let found = false;
            const extensions = ['jpg', 'jpeg', 'png', 'webp'];
            for (const ext of extensions) {
                const url = `${imageFolder}${i}.${ext}`;
                if (await checkImage(url)) {
                    images.push(url);
                    // Add immediately!
                    addSlide(url, images.length - 1);

                    found = true;
                    consecutiveFailures = 0;
                    break;
                }
            }

            if (!found) {
                consecutiveFailures++;
            }
            i++;

            if (i > 50) break;
        }

        if (images.length === 0) {
            console.warn('No images found in imagefiles/');
        }
    }

    function updateDots() {
        const dots = dotsContainer.querySelectorAll('button');
        dots.forEach((dot, index) => {
            if (index === currentIndex) {
                dot.className = 'c135 c90 c83';
            } else {
                dot.className = 'c135 c90 c71';
            }
        });
    }

    function showSlide(index) {
        if (index < 0) index = images.length - 1;
        if (index >= images.length) index = 0;

        currentIndex = index;

        const slides = sliderContainer.querySelectorAll('.slide');
        slides.forEach((slide, i) => {
            slide.style.opacity = i === currentIndex ? '1' : '0';
            slide.style.zIndex = i === currentIndex ? '10' : '0';
        });

        updateDots();
    }

    function goToSlide(index) {
        showSlide(index);
    }

    function nextSlide() {
        showSlide(currentIndex + 1);
    }

    function prevSlide() {
        showSlide(currentIndex - 1);
    }

    // Event Listeners
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);

    // Touch Support
    let touchStartX = 0;
    let touchEndX = 0;

    sliderContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    sliderContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const threshold = 50;
        if (touchEndX < touchStartX - threshold) {
            nextSlide();
        }
        if (touchEndX > touchStartX + threshold) {
            prevSlide();
        }
    }

    // Start
    loadImages();
});
