
document.addEventListener('DOMContentLoaded', async () => {
    const sliderContainer = document.getElementById('slider-container');
    const dotsContainer = document.getElementById('slider-dots');
    const prevBtn = document.getElementById('slider-prev');
    const nextBtn = document.getElementById('slider-next');
    const arrowsContainer = document.getElementById('slider-arrows');

    // Configuration
    const imageFolder = 'imagefiles/';
    // We will scan for images 1, 2, 3...
    // If not numbered, we can't easily guess, so we assume numbered.

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

    // Scan for images
    async function loadImages() {
        let i = 1;
        let consecutiveFailures = 0;
        const maxFailures = 2; // Stop if we miss 1.jpg, 2.jpg is missing? maybe just stop after 2 misses.

        while (consecutiveFailures < maxFailures) {
            let found = false;
            // Try extensions
            const extensions = ['jpg', 'jpeg', 'png', 'webp'];
            for (const ext of extensions) {
                const url = `${imageFolder}${i}.${ext}`;
                if (await checkImage(url)) {
                    images.push(url);
                    found = true;
                    // Reset check for random order if needed, but requirements say 1, 2...
                    consecutiveFailures = 0;
                    break;
                }
            }

            if (!found) {
                consecutiveFailures++;
            }
            i++;

            // Safety break 
            if (i > 50) break;
        }

        // If no numbered images found, user mentioned "randomly". 
        // We can't implement true random directory scanning in client JS.
        // We would fallback to a manual list if we had one.

        if (images.length === 0) {
            console.warn('No images found in imagefiles/');
            return;
        }

        initSlider();
    }

    function initSlider() {
        // Clear containers
        sliderContainer.innerHTML = '';
        dotsContainer.innerHTML = '';

        images.forEach((src, index) => {
            // Create Slide
            const slide = document.createElement('div');
            slide.classList.add('slide');
            slide.style.position = 'absolute';
            slide.style.top = '0';
            slide.style.left = '0';
            slide.style.width = '100%';
            slide.style.height = '100%';
            slide.style.opacity = index === 0 ? '1' : '0';
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
            startBg.style.transform = 'scale(1.1)'; // Prevent blur edges
            slide.appendChild(startBg);

            // Main Image
            const img = document.createElement('img');
            img.src = src;
            img.style.position = 'relative';
            img.style.zIndex = '2';
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            img.style.objectFit = 'contain';
            img.style.width = 'auto'; // allow it to be natural size if small
            img.style.height = 'auto';
            img.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)'; // cosmetic
            slide.appendChild(img);

            sliderContainer.appendChild(slide);

            // Create Dot
            const dot = document.createElement('button');
            // Reusing existing classes for styling might be good, but we need custom logic
            // The existing dot HTML was: button.c135.c90.c83 (active?)
            // c83 seems to be active (opacity 1). c135 is base.
            // Let's adhere to the existing classes if possible for consistency.
            // .c135 .c90 .c83 (active)
            // .c135 .c90 .c71 (inactive?) --> .c71 is 6x6px, .c83 is 16x6px (pill)?
            // Let's see the CSS details.
            // code: .c84 .c83 { width: 16px; } .c84 .c71 { width: 6px; }

            dot.className = index === 0 ? 'c135 c90 c83' : 'c135 c90 c71';
            dot.type = 'button';
            // Add click listener
            dot.addEventListener('click', () => {
                goToSlide(index);
            });

            dotsContainer.appendChild(dot);
        });
    }

    function updateDots() {
        const dots = dotsContainer.querySelectorAll('button');
        dots.forEach((dot, index) => {
            if (index === currentIndex) {
                dot.className = 'c135 c90 c83'; // Active
            } else {
                dot.className = 'c135 c90 c71'; // Inactive
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
            nextSlide(); // Swipe Left -> Next
        }
        if (touchEndX > touchStartX + threshold) {
            prevSlide(); // Swipe Right -> Prev
        }
    }

    // Start
    loadImages();
});
