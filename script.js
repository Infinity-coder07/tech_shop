window.addEventListener("load", () => {
    setTimeout(() => {
        document.getElementById("loader")?.classList.add("hide");
    }, 1000); // 1 second
});

document.addEventListener("DOMContentLoaded", () => {
    // --- Observers: price animate & cake focus ---
    const targets = document.querySelectorAll(".price-container");
    const priceObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("animate");
                priceObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    targets.forEach(t => priceObserver.observe(t));

    const cakes = document.querySelectorAll(".item");
    const cakeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("focused");
                entry.target.classList.remove("not-focused");
            } else {
                entry.target.classList.remove("focused");
                entry.target.classList.add("not-focused");
            }
        });
    }, { threshold: 0.6 });
    cakes.forEach(c => cakeObserver.observe(c));

    // Smooth scroll for menu radio changes
    document.querySelectorAll('input[name="menu"]').forEach(radio => {
        radio.addEventListener("change", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });

    // --- Cart state & elements ---
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = document.getElementById('cart-count');
    const cartCount2 = document.getElementById('cart-count2');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const itemsTotal = document.getElementById('items-total');
    const toast = document.getElementById('toast');
    const PHONE = "918105749018"; // your WhatsApp number

    // --- Toast helper ---
    function showToast(msg) {
        if (!toast) {
            console.info('Toast:', msg);
            return;
        }
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 1600);
    }

    // --- Cart persistence & UI update ---
    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function updateCart() {
        if (cartItems) cartItems.innerHTML = '';
        let total = 0, totalQty = 0;

        cart.forEach((item, i) => {
            total += item.price * item.quantity;
            totalQty += item.quantity;
            const li = document.createElement('li');
            li.innerHTML = `
                <div>${item.name} — ₹${item.price}</div>
                <div class="qty">
                  <button class="qty-btn" onclick="changeQuantity(${i}, -1)">-</button>
                  ${item.quantity}
                  <button class="qty-btn" onclick="changeQuantity(${i}, 1)">+</button>
                  <button class="remove-btn" onclick="removeFromCart(${i})">✖</button>
                </div>`;
            cartItems?.appendChild(li);
        });

        if (cartCount) {
            cartCount.textContent = totalQty > 0 ? totalQty : "";
            cartCount.style.display = totalQty > 0 ? "inline-block" : "none";
        }
        if (cartCount2) {
            cartCount2.textContent = totalQty > 0 ? totalQty : "";
            cartCount2.style.display = totalQty > 0 ? "inline-block" : "none";
        }

        if (itemsTotal) itemsTotal.textContent = total.toFixed(2);

        const grand = total + (total > 0 ? 20 : 0);
        if (cartTotal) cartTotal.textContent = grand.toFixed(2);

        assignCartWhatsAppLink();
    }

    // --- WhatsApp Links ---
    function assignCartWhatsAppLink() {
        if (!Array.isArray(cart)) return;
        const lines = [];

        if (cart.length === 0) {
            lines.push("My cart is empty, but I'd like to inquire about your products.");
        } else {
            cart.forEach(item => {
                const subtotal = (item.price || 0) * (item.quantity || 0);
                lines.push(`[${item.id}] ${item.name} ${item.quantity} x ₹${item.price} = ₹${subtotal}`);
            });
            lines.push("");
            const itemsTotalNum = cart.reduce((s, it) => s + (Number(it.price || 0) * (it.quantity || 0)), 0);
            const delivery = itemsTotalNum > 0 ? 20 : 0;
            const grand = itemsTotalNum + delivery;
            lines.push(`Subtotal: ₹${itemsTotalNum}`);
            lines.push(`Delivery: ₹${delivery}`);
            lines.push(`Total: ₹${grand}`);
        }

        const prefix = "Hello! I would like to place the following order:";
        const text = `${prefix}\n\n${lines.join('\n')}`;
        const url = `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;

        document.querySelectorAll('.order-btn2').forEach(btn => {
            if (btn.hasAttribute('onclick')) btn.removeAttribute('onclick');
            if (btn._waClickHandler) btn.removeEventListener('click', btn._waClickHandler);

            const handler = () => window.open(url, '_blank', 'noopener');
            btn.addEventListener('click', handler);
            btn._waClickHandler = handler;
        });
    }

    function setupDirectOrderLinks() {
        document.querySelectorAll('.order-btn').forEach(button => {
            const productElement = button.closest('.product');
            if (!productElement) return;

            const productId = productElement.dataset.id;
            const nameElement = productElement.closest('.item')?.querySelector('.item-info h2');
            const priceElement = productElement.closest('.item')?.querySelector('.new-price');

            if (nameElement && priceElement && productId) {
                const productName = nameElement.textContent.trim();
                const productPrice = priceElement.textContent.trim();

                const message = `Hello! I would like to order one \n\n[${productId}] ${productName} for ${productPrice}.`;
                const url = `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;

                button.setAttribute('href', url);
                button.setAttribute('target', '_blank');
                button.setAttribute('rel', 'noopener');
            }
        });
    }

    // --- Fixed addToCart (handles multiple call styles) ---
    window.addToCart = function(...args) {
        let id, name, price;

        if (args.length === 3) {
            if (typeof args[1] === 'number') {
                name = String(args[0]);
                price = Number(args[1]);
                id = String(args[2]);
            } else if (typeof args[2] === 'number') {
                id = String(args[0]);
                name = String(args[1]);
                price = Number(args[2]);
            }
        } else if (args.length === 2) {
            name = String(args[0]);
            price = Number(args[1]);

            const match = [...document.querySelectorAll('.product')].find(p => p.dataset.name === name);
            if (match) id = match.dataset.id;
        }

        if (!id) id = 'gen-' + Date.now();

        const found = cart.find(p => p.id === id) || cart.find(p => p.name === name);
        if (found) {
            found.quantity++;
        } else {
            cart.push({ id, name, price, quantity: 1 });
        }
        saveCart();
        updateCart();
        showToast(`${name} added!`);
    };

    // --- Global Cart Actions ---
    window.changeQuantity = function (i, d) {
        if (!cart[i]) return;
        cart[i].quantity += d;
        if (cart[i].quantity <= 0) cart.splice(i, 1);
        saveCart();
        updateCart();
    };

    window.removeFromCart = function (i) {
        if (!cart[i]) return;
        const itemName = cart[i].name;
        cart.splice(i, 1);
        saveCart();
        updateCart();
        showToast(`${itemName} removed.`);
    };

    window.clearCart = function () {
        cart = [];
        saveCart();
        updateCart();
        showToast('Cart cleared 🧹');
    };

    window.placeOrder = function () {
        if (cart.length === 0) {
            showToast("Your cart is empty!");
        } else {
            showToast("Order placed successfully ✅");
            clearCart();
        }
    };

    // --- Initial ---
    updateCart();
    setupDirectOrderLinks();
});
