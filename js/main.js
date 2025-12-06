// 1. Initialise Icons and AOS
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) {
        lucide.createIcons();
    }
    if (window.AOS) {
        AOS.init({
            duration: 1000,
            once: true,
            // Disable AOS on smaller screens (less than 768px) for performance
            disable: window.innerWidth < 768,
        });
        // Re-initialize AOS on resize to handle changes across breakpoints
        window.addEventListener('resize', () => {
            AOS.init({ disable: window.innerWidth < 768 });
        });
    }

    // Default gift card state + render cart from localStorage
    selectGiftCardValue(100);
    updateCartDisplay();
});

// 2. Product and Cart Data (with flavours)
const products = {
    // Whey: Chocolate, Vanilla, Cookies & Cream
    'bbwhey49': {
        name: 'Isolate Whey',
        price: 49.99,
        img: 'source/image.jpg',
        flavours: ['Chocolate', 'Vanilla', 'Cookies & Cream']
    },
    // Creatine: Unflavoured
    'bbcreat29': {
        name: 'Micronized Creatine',
        price: 29.99,
        img: 'source/creatine 2.jpg',
        flavours: ['Unflavoured']
    },
    // BCAA: Mango, Lemon Lime
    'bbpre34': {
        name: 'Essential BCAA',
        price: 34.99,
        img: 'source/bcaa.jpg',
        flavours: ['Mango', 'Lemon Lime']
    }
};

// 🔒 Persistent cart stored in localStorage (so checkout.html can read it)
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let selectedCardValue = 100; // State for the gift card value

// 🧃 Flavour selection modal state
let flavourProductId = null;
let currentSelectedFlavour = null;

// Open flavour selector for a specific product
window.openFlavourSelector = function (productId) {
    const product = products[productId];
    const modal = document.getElementById('flavour-modal');
    const titleEl = document.getElementById('flavour-modal-title');
    const flavourOptions = document.getElementById('flavour-options');

    if (!product || !modal || !titleEl || !flavourOptions) return;

    flavourProductId = productId;
    currentSelectedFlavour = null;

    titleEl.textContent = `Choose flavour for ${product.name}`;
    flavourOptions.innerHTML = '';

    const flavours = product.flavours && product.flavours.length
        ? product.flavours
        : ['Standard'];

    flavours.forEach(flavour => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = flavour;
        btn.dataset.flavour = flavour;

        // ⭐ NEW PREMIUM BUTTON STYLE
        btn.className = `
        flavour-option
        w-full p-4 rounded-2xl border flex items-center justify-between
        bg-gray-900/40 border-cyan-400/20 text-gray-200
        hover:border-cyan-400 hover:bg-gray-900/60
        transition-all duration-200 cursor-pointer
        mb-3
    `;

        // ⭐ Animated tick
        const tick = document.createElement('span');
        tick.innerHTML = '✔';
        tick.className = 'opacity-0 text-cyan-400 text-sm ml-3 transition-all';
        btn.appendChild(tick);

        // ⭐ When selected
        btn.addEventListener('click', () => {
            document.querySelectorAll('#flavour-options .flavour-option').forEach(el => {
                el.classList.remove(
                    "border-cyan-400",
                    "bg-cyan-500/10",
                    "text-cyan-300",
                    "shadow-[0_0_20px_rgba(0,255,255,0.25)]",
                    "ring-2", "ring-cyan-400", "bg-gray-900"
                );
                el.querySelector('span').classList.add('opacity-0');
            });

            // ⭐ Selected glowing state
            btn.classList.add(
                "border-cyan-400",
                "bg-cyan-500/10",
                "text-cyan-300",
                "shadow-[0_0_20px_rgba(0,255,255,0.25)]"
            );

            tick.classList.remove('opacity-0');
            currentSelectedFlavour = flavour;
        });

        flavourOptions.appendChild(btn);
    });


    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

// Close flavour modal
window.closeFlavourModal = function () {
    const modal = document.getElementById('flavour-modal');
    if (!modal) return;

    modal.classList.add('hidden');
    modal.classList.remove('flex');

    flavourProductId = null;
    currentSelectedFlavour = null;
};


// Confirm flavour and add to cart
window.confirmFlavourAndAdd = function () {
    if (!flavourProductId) {
        closeFlavourModal();
        return;
    }

    const product = products[flavourProductId];
    if (!product) {
        closeFlavourModal();
        return;
    }

    // If only one flavour, auto-select it
    if (!currentSelectedFlavour) {
        if (product.flavours && product.flavours.length === 1) {
            currentSelectedFlavour = product.flavours[0];
        } else {
            // no flavour selected and multiple options
            const msgBox = document.getElementById('message-box');
            if (msgBox) {
                // reuse global message UI
                showMessage('Select a Flavour', 'Please pick a flavour before adding to cart.');
            }
            return;
        }
    }

    addToCart(flavourProductId, currentSelectedFlavour);
    closeFlavourModal();

    // Open cart with a nice slide-in after adding
    toggleCart(true);
};

const saveCart = () => {
    localStorage.setItem('cart', JSON.stringify(cart));
};


// 3. Core Cart Functions
const updateCartDisplay = () => {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (!cartItemsContainer || !cartCount || !cartTotal || !checkoutBtn) return;

    let total = 0;
    let count = 0;
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML =
            '<p class="text-gray-500 text-center italic mt-4">Your cart is empty.</p>';
        checkoutBtn.disabled = true;
        checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');

        cart.forEach(item => {
            total += item.price * item.quantity;
            count += item.quantity;

            const itemHtml = `
    <div class="flex items-center space-x-4 p-3 bg-gray-800 rounded-lg">
        <img src="${item.img}" alt="${item.name}"
             class="w-12 h-12 rounded object-cover border border-gray-700">
        <div class="flex-grow">
            <p class="font-semibold text-white truncate">${item.name}</p>
            ${item.flavour ? `<p class="text-xs text-cyan-300">Flavour: ${item.flavour}</p>` : ''}
            <p class="text-sm text-gray-400">Qty: ${item.quantity}</p>
            <p class="text-sm text-cyan-400">$${item.price.toFixed(2)}</p>
        </div>
        <button onclick="removeFromCart('${item.id}')"
                class="text-gray-500 hover:text-red-500 transition p-1">
            <i data-lucide="trash-2" class="w-5 h-5"></i>
        </button>
    </div>
`;

            cartItemsContainer.insertAdjacentHTML('beforeend', itemHtml);
        });

        if (window.lucide) {
            lucide.createIcons(); // Re-render icons for new items
        }
    }

    cartCount.textContent = count;
    cartTotal.textContent = `$${total.toFixed(2)}`;
};

// Add item to cart (with flavour, quantity, and stored in localStorage)
const addToCart = (productId, flavour = null) => {
    const product = products[productId];
    if (!product) return;

    // Treat same product + same flavour as one line item
    const existing = cart.find(
        item => item.productId === productId && item.flavour === flavour
    );

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: Date.now(),
            productId,
            name: product.name,
            price: product.price,
            img: product.img,
            quantity: 1,
            flavour: flavour
        });
    }

    saveCart();
    updateCartDisplay();
    showMessage(
        'Item Added!',
        `${product.name}${flavour ? ' - ' + flavour : ''} has been added to your cart.`
    );
};

// Remove item from cart
const removeFromCart = (itemId) => {
    cart = cart.filter(item => String(item.id) !== String(itemId));
    saveCart();
    updateCartDisplay();
};

// Open / close cart panel
const toggleCart = (open) => {
    const cartPanel = document.getElementById('cart-panel');
    const overlay = document.getElementById('overlay');

    if (!cartPanel || !overlay) return;

    if (open) {
        cartPanel.classList.add('open');
        overlay.classList.add('active');
        updateCartDisplay();
    } else {
        cartPanel.classList.remove('open');
        overlay.classList.remove('active');
    }
};

// Gift Card Functions
// =============================
// ANIMATED GIFT CARD SYSTEM
// =============================

// Counter animation
function animateNumber(element, start, end, duration = 600) {
    let startTime = null;

    function update(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const value = Math.floor(start + (end - start) * progress);
        element.textContent = `$${value}`;
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// When gift value is selected
function animatedSelectGift(value) {
    const display = document.getElementById("card-display-value");

    animateNumber(display, selectedCardValue, value);
    selectedCardValue = value;

    // Visual selection
    document.querySelectorAll(".animated-btn").forEach(btn =>
        btn.classList.remove("selected")
    );
    const activeBtn = document.querySelector(`button[data-value="${value}"]`);
    if (activeBtn) activeBtn.classList.add("selected");
}

// Purchase animation
function animatedPurchaseGift(event) {
    event.preventDefault();

    const card = document.getElementById("gift-card-box");

    // Flip animation
    card.style.transition = "transform 0.4s ease";
    card.style.transform = "rotateY(15deg) scale(1.05)";

    setTimeout(() => {
        card.style.transform = "rotateY(0deg) scale(1)";

        // Show success message
        showMessage(
            "Gift Card Purchased!",
            `You've purchased a $${selectedCardValue} BulkBase Gift Card.`
        );
    }, 400);
}

const purchaseGiftCard = (event) => {
    showMessage(
        'Gift Card Purchase',
        `A $${selectedCardValue} BulkBase Gift Card has been successfully purchased (simulated). The digital card will be delivered to your email.`,
        event
    );
};

// 4. UI Management Functions
const mobileMenu = document.getElementById('mobile-menu');
const menuIconOpen = document.getElementById('menu-icon-open');
const menuIconClose = document.getElementById('menu-icon-close');
const backToTopBtn = document.getElementById('back-to-top');

// Scroll listener for Back to Top button
window.addEventListener('scroll', () => {
    if (!backToTopBtn) return;
    if (window.scrollY > 300) {
        backToTopBtn.classList.add('visible');
    } else {
        backToTopBtn.classList.remove('visible');
    }
});

const toggleMobileMenu = (forceState) => {
    if (!mobileMenu || !menuIconOpen || !menuIconClose) return;

    const isOpen = mobileMenu.classList.contains('is-open');

    if (forceState === false || isOpen) {
        // Close Menu
        mobileMenu.style.maxHeight = '0';
        mobileMenu.classList.remove('is-open');
        menuIconOpen.classList.remove('hidden');
        menuIconClose.classList.add('hidden');
    } else {
        // Open Menu
        mobileMenu.style.maxHeight = mobileMenu.scrollHeight + 'px';
        mobileMenu.classList.add('is-open');
        menuIconOpen.classList.add('hidden');
        menuIconClose.classList.remove('hidden');
    }
};

const mobileMenuButton = document.getElementById('mobile-menu-button');
if (mobileMenuButton) {
    mobileMenuButton.addEventListener('click', () => toggleMobileMenu());
}
// PAGE CONTROLLER
const showPage = (pageId) => {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.classList.add('hidden');    // make sure it is hidden
    });

    // Show selected page
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.add('active');
        target.classList.remove('hidden');   // make sure it is shown
    }

    // Load orders when opening profile page
    if (pageId === "profile-page") {
        loadOrderHistory();
    }

    // Scroll to top
    window.scrollTo(0, 0);
};




const showProductDetail = (productId) => {
    const product = products[productId];
    if (product) {
        showMessage(
            'Product Details',
            `Details for ${product.name} - Price: $${product.price.toFixed(2)}. This would link to a full product page in a real store.`
        );
    }
};

const showMessage = (title, text, event) => {
    if (event) event.preventDefault();
    const titleEl = document.getElementById('message-title');
    const textEl = document.getElementById('message-text');
    const box = document.getElementById('message-box');

    if (!titleEl || !textEl || !box) return;

    titleEl.textContent = title;
    textEl.textContent = text;
    box.classList.remove('hidden');
    box.classList.add('flex');
};

// ⭐ LOAD ORDER HISTORY INTO PROFILE PAGE
function loadOrderHistory() {
    const container = document.querySelector("#profile-page .order-history-container");
    if (!container) return;

    let orders = JSON.parse(localStorage.getItem("orders") || "[]");

    if (orders.length === 0) {
        container.innerHTML = `
            <p class="text-gray-400 text-center italic">No orders yet.</p>
        `;
        return;
    }

    container.innerHTML = "";

    orders.forEach(order => {
        const itemsText = order.items
            .map(i => `${i.name} (x${i.quantity})`)
            .join(", ");

        const html = `
            <div class="bg-gray-800 p-4 rounded-lg border-l-4 border-cyan-500">
                <div class="flex justify-between mb-2">
                    <span class="text-sm font-medium text-gray-400">Order #${order.id}</span>
                    <span class="text-sm font-semibold text-green-400">${order.status}</span>
                </div>
                <div class="flex justify-between text-white">
                    <span class="font-bold">$${order.total}</span>
                    <span class="text-xs text-gray-500">Placed: ${order.date}</span>
                </div>
                <p class="text-xs text-gray-500 mt-2">Items: ${itemsText}</p>
            </div>
        `;

        container.insertAdjacentHTML("beforeend", html);
    });
}


// ===============================
// ORDER HISTORY SYSTEM (NEW)
// ===============================

function loadOrderHistory() {
    const container = document.querySelector("#profile-page .order-history-container");
    if (!container) return;

    let orders = JSON.parse(localStorage.getItem("orders") || "[]");

    if (orders.length === 0) {
        container.innerHTML = `
            <p class="text-gray-400 text-center italic">No orders yet.</p>
        `;
        return;
    }

    container.innerHTML = "";

    orders.forEach(order => {
        const itemsText = order.items
            .map(i => `${i.name} (x${i.quantity})`)
            .join(", ");

        const html = `
            <div class="bg-gray-800 p-4 rounded-lg border-l-4 border-cyan-500">
                <div class="flex justify-between mb-2">
                    <span class="text-sm font-medium text-gray-400">Order #${order.id}</span>
                    <span class="text-sm font-semibold text-green-400">${order.status}</span>
                </div>
                <div class="flex justify-between text-white">
                    <span class="font-bold">$${order.total}</span>
                    <span class="text-xs text-gray-500">Placed: ${order.date}</span>
                </div>
                <p class="text-xs text-gray-500 mt-2">Items: ${itemsText}</p>
            </div>
        `;

        container.insertAdjacentHTML("beforeend", html);
    });
}
// Card builder: matches your UI theme
function buildOrderCard(order) {
    const items = order.items
        .map(item => `${item.name} (x${item.quantity})`)
        .join(", ");

    const orderID = `BB-${String(order.id).slice(-4)}`;

    return `
    <div class="p-5 bg-gray-800 rounded-xl border border-gray-700 shadow-md">
        <div class="flex justify-between items-center">
            <p class="text-lg font-semibold text-white">Order #${orderID}</p>
            <span class="text-green-400 font-semibold">Delivered</span>
        </div>

        <p class="text-2xl font-bold text-white mt-2">$${order.total.toFixed(2)}</p>
        <p class="text-gray-400 text-sm mt-1">Items: ${items}</p>

        <p class="text-gray-500 text-xs mt-2">Placed: ${order.date}</p>
    </div>`;
}

// Run on page load
document.addEventListener("DOMContentLoaded", () => {
    loadOrderHistory();
    setupHistoryToggle();
});


// ===============================
// HISTORY DROPDOWN TOGGLE
// ===============================

function setupHistoryToggle() {
    const btn = document.getElementById("toggle-history");
    const fullList = document.getElementById("order-history-full");

    if (!btn || !fullList) return;

    btn.addEventListener("click", () => {
        const isHidden = fullList.classList.contains("hidden");

        if (isHidden) {
            // Show with animation
            fullList.classList.remove("hidden");
            setTimeout(() => fullList.classList.add("history-animate"), 20);

            btn.textContent = "Hide Full History";
        } else {
            // Hide with animation
            fullList.classList.remove("history-animate");
            setTimeout(() => fullList.classList.add("hidden"), 250);

            btn.textContent = "View Full History";
        }
    });
}
/* ================================
   GIFT CARD UPGRADED SYSTEM
================================ */

let selectedGiftAmount = 150;

// Update selected value + active style + bonus system
function selectGiftCardValue(amount) {
    selectedGiftAmount = amount;
    document.getElementById("gift-selected").innerText = `$${amount}`;

    document.querySelectorAll(".gift-amount-btn").forEach(btn => {
        btn.classList.remove("active");
        if (btn.innerText === `$${amount}`) {
            btn.classList.add("active");
        }
    });

    // Auto Bonus System: G
    let bonus = 0;
    if (amount >= 200) bonus = 20;
    else if (amount >= 100) bonus = 10;

    localStorage.setItem("gift_bonus", bonus);
}

// Unique gift card code generator
function generateGiftCode() {
    return "BB-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

// E) Add Gift Card to cart
function addGiftCardToCart() {
    const email = document.getElementById("gift-email").value.trim();
    if (!email) return alert("Enter recipient email first.");

    const bonus = Number(localStorage.getItem("gift_bonus") || 0);

    const cartItem = {
        id: "gift-" + Date.now(),
        name: `Digital Gift Card ($${selectedGiftAmount})`,
        price: selectedGiftAmount,
        bonus: bonus,
        email: email,
        quantity: 1,
        img: "source/giftcard.jpg"
    };

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cart.push(cartItem);
    localStorage.setItem("cart", JSON.stringify(cart));

    alert("Gift card added to cart!");
    updateCartDisplay();
}

// D) Email Delivery Simulation
function sendGiftCardEmail() {
    const email = document.getElementById("gift-email").value.trim();
    if (!email) return alert("Enter recipient email first.");

    const code = generateGiftCode();
    localStorage.setItem("gift_code", code);

    alert(`Gift Card Sent!\nRecipient: ${email}\nCode: ${code}`);
}

