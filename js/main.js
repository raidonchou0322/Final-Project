/* =========================================================
   BOOT + UI INIT
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) lucide.createIcons();
    if (window.AOS) {
        AOS.init({ duration: 1000, once: true, disable: window.innerWidth < 768 });
        window.addEventListener("resize", () =>
            AOS.init({ disable: window.innerWidth < 768 })
        );
    }

    // Default gift card
    selectGiftCardValue(100);

    // Initial cart render
    updateCartDisplay();

    // If profile page is the first page shown, make sure analytics are ready
    if (document.getElementById("profile-page")?.classList.contains("active")) {
        loadProfileAnalytics();
        initProfileSection();
    }
});


/* =========================================================
   PRODUCT DATABASE
========================================================= */
const products = {
    bbwhey49: {
        name: "Isolate Whey",
        price: 49.99,
        img: "source/image.jpg",
        flavours: ["Chocolate", "Vanilla", "Cookies & Cream"],
    },
    bbcreat29: {
        name: "Micronized Creatine",
        price: 29.99,
        img: "source/creatine 2.jpg",
        flavours: ["Unflavoured"],
    },
    bbpre34: {
        name: "Essential BCAA",
        price: 34.99,
        img: "source/bcaa.jpg",
        flavours: ["Mango", "Lemon Lime"],
    },
};

let cart = JSON.parse(localStorage.getItem("cart") || "[]");
let flavourProductId = null;
let currentSelectedFlavour = null;


/* =========================================================
   FLAVOUR MODAL
========================================================= */
window.openFlavourSelector = function (id) {
    const product = products[id];
    const modal = document.getElementById("flavour-modal");
    const title = document.getElementById("flavour-modal-title");
    const list = document.getElementById("flavour-options");
    if (!product || !modal || !title || !list) return;

    flavourProductId = id;
    currentSelectedFlavour = null;

    modal.classList.remove("hidden");
    modal.classList.add("flex");
    title.textContent = `Choose flavour for ${product.name}`;
    list.innerHTML = "";

    product.flavours.forEach((flavour) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className =
            "flavour-option w-full p-4 bg-gray-900/40 text-gray-200 border border-cyan-400/20 rounded-xl hover:border-cyan-400 hover:bg-gray-900/60 transition flex justify-between items-center mb-3";
        btn.innerHTML = `
            <span>${flavour}</span>
            <span class="opacity-0 ml-2 text-cyan-400">✔</span>
        `;
        btn.onclick = () => {
            document.querySelectorAll(".flavour-option span:last-child").forEach((el) =>
                el.classList.add("opacity-0")
            );
            btn.querySelector("span:last-child").classList.remove("opacity-0");
            currentSelectedFlavour = flavour;
        };
        list.appendChild(btn);
    });
};

window.closeFlavourModal = function () {
    const modal = document.getElementById("flavour-modal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    flavourProductId = null;
    currentSelectedFlavour = null;
};

window.confirmFlavourAndAdd = function () {
    if (!flavourProductId) return closeFlavourModal();
    const product = products[flavourProductId];
    if (!product) return closeFlavourModal();

    if (!currentSelectedFlavour && product.flavours.length === 1) {
        currentSelectedFlavour = product.flavours[0];
    }

    if (!currentSelectedFlavour) {
        showMessage("Select a Flavour", "Please pick a flavour before adding to cart.");
        return;
    }

    addToCart(flavourProductId, currentSelectedFlavour);
    closeFlavourModal();
    toggleCart(true);
};


/* =========================================================
   CART SYSTEM
========================================================= */
function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartDisplay() {
    const container = document.getElementById("cart-items");
    const count = document.getElementById("cart-count");
    const totalEl = document.getElementById("cart-total");
    const btn = document.getElementById("checkout-btn");
    if (!container || !count || !totalEl || !btn) return;

    container.innerHTML = "";
    let total = 0;
    let qty = 0;

    if (!cart.length) {
        container.innerHTML =
            `<p class="text-gray-500 text-center italic mt-4">Your cart is empty.</p>`;
        btn.disabled = true;
        btn.classList.add("opacity-50", "cursor-not-allowed");
    } else {
        btn.disabled = false;
        btn.classList.remove("opacity-50", "cursor-not-allowed");

        cart.forEach((item) => {
            qty += item.quantity;
            total += item.price * item.quantity;

            container.insertAdjacentHTML(
                "beforeend",
                `
                <div class="flex items-center space-x-4 p-3 bg-gray-800 rounded-lg">
                    <img src="${item.img}" class="w-12 h-12 rounded border border-gray-700 object-cover">
                    <div class="flex-grow">
                        <p class="font-semibold text-white truncate">${item.name}</p>
                        ${item.flavour
                    ? `<p class="text-xs text-cyan-300">Flavour: ${item.flavour}</p>`
                    : ""
                }
                        <p class="text-sm text-gray-400">Qty: ${item.quantity}</p>
                        <p class="text-sm text-cyan-400">$${item.price.toFixed(2)}</p>
                    </div>
                    <button onclick="removeFromCart('${item.id}')"
                            class="text-gray-500 hover:text-red-500 transition p-1">
                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                    </button>
                </div>
                `
            );
        });

        if (window.lucide) lucide.createIcons();
    }

    count.textContent = qty;
    totalEl.textContent = `$${total.toFixed(2)}`;
}

function addToCart(id, flavour = null) {
    const product = products[id];
    if (!product) return;

    const existing = cart.find((i) => i.productId === id && i.flavour === flavour);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            id: Date.now(),
            productId: id,
            name: product.name,
            price: product.price,
            img: product.img,
            quantity: 1,
            flavour,
        });
    }

    saveCart();
    updateCartDisplay();
    showMessage(
        "Item Added!",
        `${product.name}${flavour ? " - " + flavour : ""} has been added to your cart.`
    );
}

function removeFromCart(id) {
    cart = cart.filter((item) => String(item.id) !== String(id));
    saveCart();
    updateCartDisplay();
}

function toggleCart(show) {
    const panel = document.getElementById("cart-panel");
    const overlay = document.getElementById("overlay");
    if (!panel || !overlay) return;

    if (show) {
        panel.classList.add("open");
        overlay.classList.add("active");
        updateCartDisplay();
    } else {
        panel.classList.remove("open");
        overlay.classList.remove("active");
    }
}


/* =========================================================
   ORDER STORAGE / HELPERS
========================================================= */
function getOrders() {
    return JSON.parse(localStorage.getItem("orders") || "[]");
}

function buildOrderCard(order) {
    const itemList = order.items
        .map(i => `<li class="flex justify-between text-gray-300 text-sm">
                      <span>${i.name} x${i.quantity}</span>
                      <span class="text-cyan-300">$${(i.price * i.quantity).toFixed(2)}</span>
                   </li>`)
        .join("");

    const status = order.status || "Delivered";
    const badgeColor =
        status === "Delivered" ? "bg-green-500/20 text-green-400" :
            status === "Processing" ? "bg-yellow-500/20 text-yellow-400" :
                "bg-red-500/20 text-red-400";

    return `
        <div class="order-card p-5 bg-gray-800/80 border border-gray-700 rounded-2xl shadow hover:border-cyan-400 transition cursor-pointer group">

            <div class="flex justify-between items-center mb-2">
                <p class="font-bold text-white">Order #${order.id}</p>
                <span class="text-cyan-400 text-lg font-semibold">$${Number(order.total || 0).toFixed(2)}</span>
            </div>

            <p class="text-xs text-gray-500">${order.date}</p>

            <div class="mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}">
                ${status}
            </div>

            <div class="order-items hidden mt-4 border-t border-gray-700 pt-3">
                <ul class="space-y-2">${itemList}</ul>
            </div>

            <div class="mt-2 flex text-cyan-400 text-xs opacity-60 group-hover:opacity-100 transition">
                <i data-lucide="chevron-down" class="w-3 h-3 mr-1"></i>
                Click to view details
            </div>
        </div>
    `;
}
/* =========================================================
   TIER BENEFITS PER UNLOCK
========================================================= */
const tierBenefits = {
    "New Member": [
        "Welcome badge unlocked 🎉",
        "You start earning reward points!"
    ],
    "Silver": [
        "2% cashback on every order ⭐",
        "Priority support access",
        "Exclusive monthly promo"
    ],
    "Gold": [
        "5% cashback on every order ✨",
        "VIP early product access",
        "Free sample in every order"
    ],
    "Elite": [
        "10% cashback 🔥",
        "Invite-only product drops",
        "Birthday gift pack",
        "Expedited support channel"
    ]
};


/* =========================================================
   TIER THRESHOLDS
========================================================= */
const tierThresholds = {
    "New Member": 0,
    Silver: 10,
    Gold: 25,
    Elite: 60,
};

/* =========================================================
   TIER COLOR THEMES FOR UI
========================================================= */
const tierColors = {
    "New Member": {
        badge: "#6b7280",      // gray
        bar: "#6b7280",
        glow: "rgba(107,114,128,0.3)",
    },
    Silver: {
        badge: "#c0c0c0",
        bar: "#c0c0c0",
        glow: "rgba(192,192,192,0.4)",
    },
    Gold: {
        badge: "#ffbf00",
        bar: "#ffbf00",
        glow: "rgba(255,191,0,0.45)",
    },
    Elite: {
        badge: "#00eaff",
        bar: "#00eaff",
        glow: "rgba(0,234,255,0.5)",
    },
};


function calculateProgressToNextTier(orderCount) {
    if (orderCount >= tierThresholds.Elite) return 100;

    let nextTier = null;

    if (orderCount < tierThresholds.Silver) nextTier = "Silver";
    else if (orderCount < tierThresholds.Gold) nextTier = "Gold";
    else if (orderCount < tierThresholds.Elite) nextTier = "Elite";

    const currentTier = orderCount >= tierThresholds.Gold
        ? "Gold"
        : orderCount >= tierThresholds.Silver
            ? "Silver"
            : "New Member";

    const start = tierThresholds[currentTier];
    const end = tierThresholds[nextTier];

    if (!end || end === start) return 0;

    return Math.min(100, Math.round(((orderCount - start) / (end - start)) * 100));
}

function applyTierTextColor(tier) {
    const tierTextEl = document.getElementById("stat-tier");
    if (!tierTextEl) return;

    // Reset previous classes/colors
    tierTextEl.style.color = "";
    tierTextEl.style.textShadow = "";

    const tierGlow = {
        "New Member": {
            color: "#9ca3af",
            glow: "0 0 6px rgba(156,163,175,0.5)"
        },
        "Silver": {
            color: "#cfd8ea",
            glow: "0 0 8px rgba(200,200,255,0.6)"
        },
        "Gold": {
            color: "#ffd86b",
            glow: "0 0 10px rgba(255,215,100,0.7)"
        },
        "Elite": {
            color: "#00eaff",
            glow: "0 0 16px rgba(0,234,255,0.9)"
        }
    };

    const theme = tierGlow[tier] || tierGlow["New Member"];

    tierTextEl.style.color = theme.color;
    tierTextEl.style.textShadow = theme.glow;
}


/* =========================================================
   ANALYTICS ENGINE + REAL-TIME PROGRESS BAR
========================================================= */
function loadProfileAnalytics() {
    const orders = getOrders();

    const statOrders = document.getElementById("stat-orders");
    const statSpent = document.getElementById("stat-spent");
    const statTier = document.getElementById("stat-tier");

    const anaTopItem = document.getElementById("ana-top-item");
    const anaAOV = document.getElementById("ana-aov");
    const anaLast = document.getElementById("ana-last");

    const progressBar = document.getElementById("tier-progress-bar");
    const tierBadge = document.getElementById("profile-tier-badge");

    if (!statOrders || !statSpent || !statTier || !anaTopItem || !anaAOV || !anaLast) return;

    if (!orders.length) {
        statOrders.textContent = "0";
        statSpent.textContent = "$0.00";
        statTier.textContent = "New Member";
        anaTopItem.textContent = "-";
        anaAOV.textContent = "-";
        anaLast.textContent = "-";

        if (progressBar) {
            progressBar.style.transition = "width 0.7s ease";
            progressBar.style.width = "0%";
            progressBar.dataset.current = "0";
        }

        if (tierBadge) {
            tierBadge.textContent = "New Member";
        }
        return;
    }

    // Totals
    const orderCount = orders.length;
    statOrders.textContent = orderCount.toString();

    const totalSpent = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    statSpent.textContent = `$${totalSpent.toFixed(2)}`;

    // Determine tier
    let tier = "New Member";
    if (orderCount >= tierThresholds.Elite) tier = "Elite";
    else if (orderCount >= tierThresholds.Gold) tier = "Gold";
    else if (orderCount >= tierThresholds.Silver) tier = "Silver";



    statTier.textContent = tier;
    applyTierTextColor(tier);


    if (tierBadge) {
        tierBadge.textContent = tier;

        const color = tierColors[tier];

        tierBadge.style.backgroundColor = color.badge;
        tierBadge.style.color = "#000"; // readable text
        tierBadge.style.boxShadow = `0 0 15px ${color.glow}`;
        tierBadge.style.transition = "all .3s ease";

    }

    // Tier Unlock Event
    const savedTier = localStorage.getItem("lastTier") || "New Member";

    if (tier !== savedTier) {
        triggerTierUnlockPopup(
            tier,
            tierColors[tier] || tierColors["New Member"]
        );
    }


    // MOST BOUGHT PRODUCT
    const count = {};
    orders.forEach((o) =>
        o.items.forEach((i) => {
            count[i.name] = (count[i.name] || 0) + i.quantity;
        })
    );

    let topProduct = "-";
    let max = 0;
    Object.entries(count).forEach(([name, qty]) => {
        if (qty > max) {
            max = qty;
            topProduct = name;
        }
    });
    anaTopItem.textContent = topProduct;

    // Average order value
    anaAOV.textContent = `$${(totalSpent / orderCount).toFixed(2)}`;

    // Last purchase date (latest first in saveOrder, so last element == oldest)
    anaLast.textContent = orders[0]?.date || "-";

    // PROGRESS ANIMATION
    if (progressBar) {
        const target = calculateProgressToNextTier(orderCount);
        const current = parseFloat(progressBar.dataset.current || "0");

        const start = isNaN(current) ? 0 : current;
        const end = target;
        const duration = 700;
        let startTime = null;

        progressBar.style.transition = "none";

        function step(ts) {
            if (!startTime) startTime = ts;
            const progress = Math.min((ts - startTime) / duration, 1);
            const value = start + (end - start) * progress;
            progressBar.style.width = `${value.toFixed(1)}%`;


            if (progressBar) {
                const color = tierColors[tier];
                progressBar.style.backgroundColor = color.bar;
                progressBar.style.boxShadow = `0 0 20px ${color.glow}`;
                progressBar.style.transition = "background .3s ease, box-shadow .3s ease";
            }



            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                progressBar.dataset.current = String(end);
            }
        }

        requestAnimationFrame(step);
    }
}


/* =========================================================
   PROFILE INIT
========================================================= */
function initProfileSection() {
    // Refresh stats + progress
    loadProfileAnalytics();

    const orders = getOrders();
    const latest = document.getElementById("order-latest");
    const full = document.getElementById("order-history-full");

    if (!latest || !full) return;

    latest.innerHTML = "";
    full.innerHTML = "";

    // Render latest 5
    orders.slice(0, 5).forEach(order =>
        latest.insertAdjacentHTML("beforeend", buildOrderCard(order))
    );

    // Render full history
    orders.forEach(order =>
        full.insertAdjacentHTML("beforeend", buildOrderCard(order))
    );

    if (window.lucide) lucide.createIcons();
}


/* =========================================================
   PAGE CONTROLLER  
========================================================= */
window.showPage = function (id) {

    // Hide all pages
    document.querySelectorAll(".page").forEach((p) => {
        p.classList.add("hidden");
        p.classList.remove("active");
    });

    // Show selected page
    const target = document.getElementById(id);
    if (target) {
        target.classList.remove("hidden");
        target.classList.add("active");
    }

    // When profile loads, refresh analytics + history button logic
    if (id === "profile-page") {
        initProfileSection();   // render list + stats
        setupHistoryToggle();   // attach toggle logic
        if (window.lucide) lucide.createIcons(); // refresh icons
    }

    // Refresh AOS animations
    if (window.AOS) AOS.refresh();

    // Scroll to top on change
    window.scrollTo(0, 0);
};


/* =========================================================
   FULL HISTORY TOGGLE
========================================================= */
function setupHistoryToggle() {
    const btn = document.getElementById("toggle-history-btn");
    const fullPanel = document.getElementById("order-history-full");
    const latestPanel = document.getElementById("order-latest");

    if (!btn || !fullPanel || !latestPanel) return;

    let open = false;

    btn.onclick = () => {
        open = !open;

        if (open) {
            /* HIDE RECENT LIST */
            latestPanel.style.transition =
                "opacity 260ms ease, transform 260ms ease";
            latestPanel.style.opacity = "0";
            latestPanel.style.transform = "translateY(10px)";

            // Fully hide after fade completes
            setTimeout(() => latestPanel.classList.add("hidden"), 260);

            /* PREP FULL HISTORY ENTRY */
            fullPanel.classList.remove("hidden");
            fullPanel.style.opacity = "0";
            fullPanel.style.transform = "translateY(14px) scale(0.96)";
            fullPanel.style.transition =
                "opacity 420ms cubic-bezier(0.18, 0.89, 0.32, 1.28), transform 420ms cubic-bezier(0.18, 0.89, 0.32, 1.28)";

            /* PLAY EXPAND ANIMATION */
            requestAnimationFrame(() => {
                fullPanel.style.opacity = "1";
                fullPanel.style.transform = "translateY(0) scale(1)";
            });

            btn.innerHTML =
                `Hide Full History <i data-lucide="chevron-up" class="w-4 h-4"></i>`;
        } else {
            /* ANIMATE FULL PANEL OUT  */
            fullPanel.style.transition =
                "opacity 320ms cubic-bezier(0.18, 0.89, 0.32, 1.28), transform 320ms cubic-bezier(0.18, 0.89, 0.32, 1.28)";
            fullPanel.style.opacity = "0";
            fullPanel.style.transform = "translateY(14px) scale(0.95)";

            // Fully hide after animation finishes
            setTimeout(() => fullPanel.classList.add("hidden"), 320);

            /*  BRING BACK LATEST LIST  */
            latestPanel.classList.remove("hidden");
            latestPanel.style.opacity = "0";
            latestPanel.style.transform = "translateY(-10px) scale(0.98)";
            latestPanel.style.transition =
                "opacity 380ms cubic-bezier(0.18, 0.89, 0.32, 1.28), transform 380ms cubic-bezier(0.18, 0.89, 0.32, 1.28)";

            requestAnimationFrame(() => {
                latestPanel.style.opacity = "1";
                latestPanel.style.transform = "translateY(0) scale(1)";
            });

            btn.innerHTML =
                `View Full History <i data-lucide="chevron-down" class="w-4 h-4"></i>`;
        }

        if (window.lucide) lucide.createIcons();
    };
}




/* =========================================================
   ORDER CARD EXPAND/COLLAPSE
========================================================= */
document.addEventListener("click", (event) => {
    const card = event.target.closest(".order-card");
    if (!card) return;

    const details = card.querySelector(".order-items");
    if (!details) return;

    const isOpen = !details.classList.contains("hidden");

    document.querySelectorAll(".order-items").forEach((el) =>
        el.classList.add("hidden")
    );

    if (!isOpen) {
        details.classList.remove("hidden");
    }
});


/* =========================================================
   GLOBAL MESSAGE MODAL
========================================================= */
function showMessage(title, text, event) {
    if (event) event.preventDefault();

    const box = document.getElementById("message-box");
    const titleEl = document.getElementById("message-title");
    const textEl = document.getElementById("message-text");
    if (!box || !titleEl || !textEl) return;

    titleEl.textContent = title || "";
    textEl.textContent = text || "";
    box.classList.remove("hidden");
    box.classList.add("flex");
}


/* =========================================================
   PROFILE NAME UPDATE TOAST 
========================================================= */
window.showNameToast = function (msg) {
    const toast = document.getElementById("name-toast");
    if (!toast) return;

    toast.textContent = msg;

    // Reset state cleanly before animation
    toast.classList.remove("hidden");
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px) scale(0.95)";
    toast.style.pointerEvents = "auto";

    // Let browser register style before animating
    requestAnimationFrame(() => {
        toast.style.transition = "opacity .35s ease, transform .35s ease";
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0) scale(1)";
    });

    // Auto hide after 2 seconds
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px) scale(0.95)";

        // Cleanup after animation completes
        setTimeout(() => {
            toast.classList.add("hidden");
            toast.style.pointerEvents = "none";
        }, 350);
    }, 2000);
};


/* =========================================================
   GIFT CARD ANIMATION
========================================================= */
let selectedCardValue = 100;

function animateNumber(element, start, end, duration = 600) {
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const value = Math.round(start + (end - start) * progress);
        element.textContent = `$${value}`;
        if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

function animatedSelectGift(value) {
    const display = document.getElementById("card-display-value");
    if (!display) return;

    animateNumber(display, selectedCardValue, value);
    selectedCardValue = value;

    document.querySelectorAll(".animated-btn").forEach((btn) =>
        btn.classList.remove("selected")
    );
    const activeBtn = document.querySelector(`button[data-value="${value}"]`);
    if (activeBtn) activeBtn.classList.add("selected");
}

let giftAnimating = false;

function animatedPurchaseGift(event) {
    if (event) event.preventDefault();

    // Prevent double click spam glitch
    if (giftAnimating) return;
    giftAnimating = true;

    const card = document.getElementById("gift-card-box");
    if (!card) return;

    // Reset before animation
    card.style.transition = "none";
    card.style.transform = "scale(1) rotateY(0deg)";
    card.style.boxShadow = "";

    // Start delay
    requestAnimationFrame(() => {

        card.style.transition = `
            transform 0.65s cubic-bezier(0.21, 1.02, 0.73, 1),
            box-shadow 0.65s ease
        `;

        // Lift + rotate + glow
        card.style.transform = "translateY(-6px) rotateY(12deg) scale(1.03)";
        card.style.boxShadow = "0 0 55px rgba(0,255,255,0.55)";

        setTimeout(() => {
            // Reset motion
            card.style.transform = "translateY(0) rotateY(0deg) scale(1)";
            card.style.boxShadow = "0 0 25px rgba(0,255,255,0.25)";

            // After animation finishes, show popup
            setTimeout(() => {
                showMessage(
                    "Gift Card Purchased 🎉",
                    `You've successfully bought a $${selectedCardValue} BulkBase Gift Card!`
                );

                // Release lock
                giftAnimating = false;

            }, 350);

        }, 650);

    });
}

function selectGiftCardValue(amount) {
    selectedCardValue = amount;
    const display = document.getElementById("card-display-value");
    if (display) display.textContent = `$${amount}`;
}

/* =========================================================
    TIER UNLOCK POPUP + EFFECT ENGINE
========================================================= */
let lastTier = localStorage.getItem("lastTier") || "New Member";

function triggerTierUnlockPopup(tierName, color) {

    const popup = document.getElementById("tier-unlock-popup");
    const box = document.getElementById("tier-popup-box");
    const title = document.getElementById("tier-unlock-title");
    const text = document.getElementById("tier-unlock-text");
    const confetti = document.getElementById("tier-confetti");
    const particles = document.getElementById("tier-particles");
    const perkArea = document.getElementById("tier-benefits");

    if (!popup || !box || !title) return;

    // Title + subtitle
    title.style.color = color.badge;
    text.textContent = `Congratulations! You’ve reached ${tierName} Tier 🎉`;

    //  Glow bar update
    const glowBar = document.getElementById("tier-glow-bar");
    if (glowBar) {
        glowBar.style.background = color.badge;
        glowBar.style.boxShadow = `0 0 35px ${color.glow}`;
    }

    //  Update perk list visually
    if (perkArea) {
        perkArea.innerHTML = ""; // reset

        const perks = tierBenefits[tierName] || [];

        perks.forEach((p, index) => {
            let item = document.createElement("div");
            item.className = "perk-item"; // animation class
            item.textContent = "• " + p;
            perkArea.appendChild(item);

            // staggered animation like Shopify reveal
            setTimeout(() => {
                item.classList.add("show");
            }, 200 + index * 120);
        });
    }

    // RESET EFFECT LAYERS
    confetti.innerHTML = "";
    particles.innerHTML = "";

    //  confetti burst
    for (let i = 0; i < 30; i++) {
        const piece = document.createElement("div");
        piece.className = "confetti-piece";
        piece.style.left = Math.random() * 100 + "%";
        piece.style.top = "-10px";
        piece.style.background = Math.random() > 0.5 ? color.badge : "#ffffff";
        piece.style.width = Math.random() * 6 + 4 + "px";
        piece.style.height = Math.random() * 10 + 8 + "px";
        piece.style.animationDelay = (Math.random() * 0.4) + "s";
        confetti.appendChild(piece);
    }

    // Floating atmospheric particles
    for (let i = 0; i < 12; i++) {
        const dot = document.createElement("div");
        dot.className = "absolute rounded-full blur-md bg-cyan-300/50";
        const size = 3 + Math.random() * 6;
        dot.style.width = `${size}px`;
        dot.style.height = `${size}px`;
        dot.style.left = Math.random() * 100 + "%";
        dot.style.top = Math.random() * 100 + "%";
        dot.style.animation = `floatingParticle ${2.5 + Math.random() * 3}s infinite ease-in-out`;
        particles.appendChild(dot);
    }

    //  Animate popup open
    popup.classList.remove("pointer-events-none");
    popup.style.opacity = "1";

    requestAnimationFrame(() => {
        box.style.opacity = "1";
        box.style.transform = "scale(1)";
    });

    // Save the new unlocked tier
    localStorage.setItem("lastTier", tierName);
}



window.hideTierUnlockPopup = function () {
    const popup = document.getElementById("tier-unlock-popup");
    const box = document.getElementById("tier-popup-box");

    box.style.opacity = "0";
    box.style.transform = "scale(0.9)";

    setTimeout(() => {
        popup.style.opacity = "0";
        popup.classList.add("pointer-events-none");
    }, 300);
};


/* =========================================================
    TIER UNLOCK POPUP
========================================================= */

window.hideTierUnlockPopup = function () {
    const popup = document.getElementById("tier-unlock-popup");
    const box = document.getElementById("tier-popup-box");

    box.style.opacity = "0";
    box.style.transform = "scale(0.9)";

    setTimeout(() => {
        popup.style.opacity = "0";
        popup.classList.add("pointer-events-none");
    }, 300);
};

/* =========================================================
   Tier Benefit Modal Controller
========================================================= */
window.openTierBenefitPanel = function () {
    const popup = document.getElementById("tier-benefit-popup");
    const box = document.getElementById("tier-benefit-box");
    const tierText = document.getElementById("stat-tier")?.textContent || "Unknown";
    const title = document.getElementById("benefit-title");
    const desc = document.getElementById("benefit-desc");
    const list = document.getElementById("benefit-list");

    if (!popup || !box || !list) return;

    list.innerHTML = ""; // reset

    title.textContent = `${tierText} Tier Benefits`;
    desc.textContent = `${tierText} Member Benefits`;

    const perks = tierBenefits[tierText] || [];

    perks.forEach((p, i) => {
        let item = document.createElement("div");
        item.className = "benefit-item";
        item.textContent = "• " + p;
        list.appendChild(item);

        setTimeout(() => {
            item.classList.add("show");
        }, 150 + i * 120);
    });

    popup.classList.remove("pointer-events-none");
    popup.style.opacity = "1";

    requestAnimationFrame(() => {
        box.style.opacity = "1";
        box.style.transform = "scale(1)";
    });
};

window.closeTierBenefitPanel = function () {
    const popup = document.getElementById("tier-benefit-popup");
    const box = document.getElementById("tier-benefit-box");

    if (!popup || !box) return;

    box.style.opacity = "0";
    box.style.transform = "scale(0.9)";

    setTimeout(() => {
        popup.style.opacity = "0";
        popup.classList.add("pointer-events-none");
    }, 300);
};

/* =========================================================
   RESET ORDER HISTORY BUTTON
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
    const resetBtn = document.getElementById("reset-orders-btn");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (confirm("Are you sure? This will clear your order history.")) {
                localStorage.removeItem("orders");
                initProfileSection();
                loadProfileAnalytics();
                alert("Order history reset successfully!");
            }
        });
    }
});


/* =========================================================
   PRIVACY POLICY AUTO-DATE UPDATE
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
    const el = document.getElementById("policy-date");
    if (el) {
        const today = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
        el.textContent = today;
    }
});
