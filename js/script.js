// Import Firebase
import { db, collection, addDoc } from './firebase-config.js';

let cart = [];

// Charger le panier et la session au démarrage
window.addEventListener('DOMContentLoaded', () => {
  const saved = sessionStorage.getItem('cocoHairCart');
  if (saved) {
    cart = JSON.parse(saved);
    updateCart();
  }

  // Exposer les fonctions globalement
  window.addToCart = addToCart;
  window.toggleCart = toggleCart;
  window.removeFromCart = removeFromCart;
  window.updateCart = updateCart;
  window.checkout = checkout;
  window.closeCheckout = closeCheckout;
  window.confirmCheckout = confirmCheckout;
  window.closeOrderModal = closeOrderModal;
  window.showToast = showToast;
  window.toggleNavMenu = toggleNavMenu;
  window.closeNavMenu = closeNavMenu;
  window.showSection = showSection;

  // Ajouter l'événement du formulaire de contact
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactForm);
  }

  // Ajouter animation au clic sur les cartes produit (mobile)
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    card.addEventListener('click', function() {
      this.classList.add('clicked');
      setTimeout(() => {
        this.classList.remove('clicked');
      }, 500);
    });
  });
});

// Animation des cartes "Comment utiliser"
function initAnimations() {
  const howCards = document.querySelectorAll('.how-card');
  if (howCards.length === 0) {
    setTimeout(initAnimations, 100);
    return;
  }
  howCards.forEach((card, index) => {
    setTimeout(() => {
      card.style.animation = 'none';
      setTimeout(() => {
        card.style.animation = 'rotateIn 0.7s ease-out forwards';
      }, 10);
    }, index * 150);
  });
}

window.addEventListener('load', initAnimations);
document.addEventListener('DOMContentLoaded', initAnimations);
setTimeout(initAnimations, 500);

function addToCart(name, price, img, btn) {
  const existing = cart.find(i => i.name === name);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name, price, img, qty: 1 });
  }

  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Ajouté';
  btn.classList.add('added');
  setTimeout(() => {
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Ajouter';
    btn.classList.remove('added');
  }, 1800);
  updateCart();
  showToast(name + ' ajouté');
}

function removeFromCart(i) {
  cart.splice(i, 1);
  updateCart();
}

function changeQty(i, d) {
  cart[i].qty += d;
  if (cart[i].qty <= 0) cart.splice(i, 1);
  updateCart();
}

function updateCart() {
  // Sauvegarder le panier dans localStorage
  sessionStorage.setItem('cocoHairCart', JSON.stringify(cart));

  const total = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cartCount').textContent = total;

  const container = document.getElementById('cartItems');
  if (!cart.length) {
    container.innerHTML = `<div class="cart-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg><p>Votre panier est vide</p></div>`;
  } else {
    container.innerHTML = cart.map((item, i) => `
      <div class="cart-item">
        <img class="cart-item-img"
          src="${item.img}"
          alt="${item.name}"
          onerror="this.src='https://picsum.photos/seed/${i}/100/100'"
        >
        <div class="cart-item-info">
          <strong>${item.name}</strong>
          <span>${item.price.toLocaleString()} Ar</span>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty(${i},-1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${i},+1)">+</button>
          <button class="remove-item" onclick="removeFromCart(${i})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            </svg>
          </button>
        </div>
      </div>`).join('');
  }

  const totalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('cartTotal').textContent = totalPrice.toLocaleString() + ' Ar';
}

function toggleNavMenu() {
  const sidebar = document.getElementById('navSidebar');
  const overlay = document.getElementById('navOverlay');
  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
}

function closeNavMenu() {
  const sidebar = document.getElementById('navSidebar');
  const overlay = document.getElementById('navOverlay');
  sidebar.classList.remove('active');
  overlay.classList.remove('active');
}

function toggleCart(e) {
  e.preventDefault();
  document.getElementById('cartOverlay').classList.toggle('open');
  document.getElementById('cartSidebar').classList.toggle('open');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function checkout() {
  if (!cart.length) {
    showToast('Panier vide !');
    return;
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  // Créer un formulaire de commande
  const formHTML = `
    <div class="checkout-modal" id="checkoutModal">
      <div class="checkout-content">
        <button class="checkout-close" onclick="closeCheckout()">×</button>
        <h2>Finaliser votre commande</h2>

        <div class="checkout-section">
          <h3>Vos informations</h3>
          <input type="text" id="checkoutName" placeholder="Nom complet" required>
          <input type="tel" id="checkoutPhone" placeholder="Numéro téléphone" required>
          <input type="text" id="checkoutCity" placeholder="Ville" required>
        </div>

        <div class="checkout-section">
          <h3>Livraison</h3>
          <select id="checkoutDelivery" required onchange="updateDeliveryFee()">
            <option value="">Sélectionner une option</option>
            <option value="express">Express - 5 000 Ar</option>
            <option value="pickup">Retrait Fianarantsoa - 3 000 Ar</option>
          </select>
        </div>

        <div class="checkout-section">
          <h3>Récapitulatif</h3>
          <div class="checkout-summary">
            ${cart.map(item => `
              <div class="summary-item">
                <span>${item.name} × ${item.qty}</span>
                <span>${(item.price * item.qty).toLocaleString()} Ar</span>
              </div>
            `).join('')}
            <div class="summary-divider"></div>
            <div class="summary-item">
              <span>Sous-total</span>
              <span>${total} Ar</span>
            </div>
            <div class="summary-item" id="deliveryFeeRow" style="display:none;">
              <span>Frais de livraison</span>
              <span id="deliveryFeeAmount">0 Ar</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-item total">
              <strong>Total TTC</strong>
              <strong id="checkoutTotal">${total.toLocaleString()} Ar</strong>
            </div>
          </div>
        </div>

        <div class="checkout-section">
          <h3>Informations de paiement</h3>
          <div class="payment-info">
            <p><strong>Veuillez envoyer ${total.toLocaleString()} Ar à:</strong></p>
            <div class="payment-methods">
              <div class="payment-method">
                <span class="method-label">MVola</span>
              </div>
            </div>
          </div>
        </div>

        <button class="btn-primary" style="width:100%;margin-top:20px;" onclick="confirmCheckout('${total}')">
          Confirmer la commande
        </button>
      </div>
    </div>
  `;

  // Ajouter le modal au DOM
  document.body.insertAdjacentHTML('beforeend', formHTML);
  document.getElementById('checkoutModal').style.display = 'flex';
}

function closeCheckout() {
  const modal = document.getElementById('checkoutModal');
  if (modal) modal.remove();
}

async function confirmCheckout(total) {
  const name = document.getElementById('checkoutName').value;
  const phone = document.getElementById('checkoutPhone').value;
  const city = document.getElementById('checkoutCity').value;
  const delivery = document.getElementById('checkoutDelivery').value;

  // Validation
  if (!name || !phone || !city || !delivery) {
    showToast('Veuillez remplir tous les champs');
    return;
  }

  // Calculer les frais de livraison
  let deliveryFee = 0;
  if (delivery === 'express') {
    deliveryFee = 5000; // Express: 5000 Ar
  } else if (delivery === 'pickup') {
    deliveryFee = 3000; // Fianarantsoa: 3000 Ar
  }

  const totalWithDelivery = parseInt(total) + deliveryFee;

  // Sauvegarder la commande
  const order = {
    id: Date.now(),
    date: new Date().toLocaleString('fr-FR'),
    customer: { name, phone, city },
    items: cart,
    subtotal: parseInt(total),
    deliveryFee: deliveryFee,
    total: totalWithDelivery,
    delivery,
    status: 'en attente de paiement',
    history: [
      { status: 'en attente de paiement', date: new Date().toLocaleString('fr-FR') }
    ]
  };

  // Sauvegarder dans Firestore
  try {
    await addDoc(collection(db, 'orders'), order);
    console.log('✅ Commande sauvegardée dans Firestore:', order);

    // Garder aussi dans localStorage comme backup
    const orders = JSON.parse(localStorage.getItem('cocoHairOrders') || '[]');
    orders.push(order);
    localStorage.setItem('cocoHairOrders', JSON.stringify(orders));
  } catch (error) {
    console.error('❌ Erreur sauvegarde Firestore:', error);
    // Fallback: sauvegarder juste en localStorage
    const orders = JSON.parse(localStorage.getItem('cocoHairOrders') || '[]');
    orders.push(order);
    localStorage.setItem('cocoHairOrders', JSON.stringify(orders));
  }

  // Envoyer notification au propriétaire
  sendNotificationToOwner(order);

  // Fermer et réinitialiser
  closeCheckout();
  setTimeout(() => {
    cart = [];
    updateCart();
    document.getElementById('cartOverlay').classList.remove('open');
    document.getElementById('cartSidebar').classList.remove('open');
    showToast('Commande confirmée. Veuillez procéder au paiement.');
  }, 500);
}

function updateDeliveryFee() {
  const delivery = document.getElementById('checkoutDelivery').value;
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  let deliveryFee = 0;
  if (delivery === 'express') {
    deliveryFee = 5000;
  } else if (delivery === 'pickup') {
    deliveryFee = 3000;
  }

  const total = subtotal + deliveryFee;

  // Afficher les frais de livraison
  const deliveryFeeRow = document.getElementById('deliveryFeeRow');
  deliveryFeeRow.style.display = 'flex';
  document.getElementById('deliveryFeeAmount').textContent = deliveryFee.toLocaleString() + ' Ar';

  // Mettre à jour le total
  document.getElementById('checkoutTotal').textContent = total.toLocaleString() + ' Ar';
}

function sendNotificationToOwner(order) {
  // Message pour le propriétaire
  const itemsList = order.items.map(i => `${i.name} x${i.qty} = ${(i.price * i.qty).toLocaleString()} Ar`).join('\n');
  const deliveryLabel = order.delivery === 'express' ? 'Express (2-3 jours)' :
                       order.delivery === 'standard' ? 'Standard (5-7 jours)' : 'Retrait Fianarantsoa';

  const message = `🛍️ NOUVELLE COMMANDE #${order.id}

CLIENT: ${order.customer.name}
Tel: ${order.customer.phone}
Email: ${order.customer.email}

ADRESSE: ${order.customer.address}, ${order.customer.city}
LIVRAISON: ${deliveryLabel}

ARTICLES:
${itemsList}

TOTAL: ${order.total.toLocaleString()} Ar

EN ATTENTE DE PAIEMENT via MVola`;

  // 1. Envoyer WhatsApp au propriétaire
  const ownerPhone = '34702058'; // Numéro sans +261
  const whatsappUrl = `https://wa.me/261${ownerPhone}?text=${encodeURIComponent(message)}`;

  // Ouvrir WhatsApp dans un nouvel onglet (optionnel)
  // window.open(whatsappUrl, '_blank');

  // 2. Envoyer email au propriétaire (si EmailJS est configuré)
  if (typeof emailjs !== 'undefined') {
    emailjs.send('service_l6s6rs9', 'template_ownry6p', {
      to_email: 'tafitaperl@gmail.com',
      order_id: order.id,
      customer_name: order.customer.name,
      customer_phone: order.customer.phone,
      customer_email: order.customer.email,
      customer_address: order.customer.address,
      items: itemsList,
      total: order.total.toLocaleString(),
      message: message
    }).then(
      response => console.log('Email envoyé:', response),
      error => console.log('Erreur email:', error)
    );
  }

  // 3. Envoyer email de confirmation au client
  if (typeof emailjs !== 'undefined') {
    const clientMessage = `Bonjour ${order.customer.name},

Votre commande #${order.id} a été confirmée.

TOTAL: ${order.total.toLocaleString()} Ar

Veuillez envoyer le paiement via MVola

Après paiement, votre commande sera livrée ${deliveryLabel.toLowerCase()}.

Merci d'avoir choisi CocoHair!`;

    emailjs.send('service_l6s6rs9', 'YOUR_CLIENT_TEMPLATE_ID', {
      to_email: order.customer.email,
      customer_name: order.customer.name,
      message: clientMessage
    }).then(
      response => console.log('Email client envoyé:', response),
      error => console.log('Erreur email client:', error)
    );
  }
}

// Gérer le formulaire de contact
function handleContactForm(e) {
  e.preventDefault();

  const name = document.getElementById('contactName').value;
  const email = document.getElementById('contactEmail').value;
  const phone = document.getElementById('contactPhone').value;
  const message = document.getElementById('contactMessage').value;

  // Validation
  if (!name || !email || !phone || !message) {
    showToast('Veuillez remplir tous les champs');
    return;
  }

  // Envoyer le message par email
  if (typeof emailjs !== 'undefined') {
    emailjs.send('service_l6s6rs9', 'template_27cc71w', {
      name: name,
      title: `${email} - ${phone} - ${message}`
    }).then(
      response => {
        showToast('Message envoyé avec succès!');
        document.getElementById('contactForm').reset();
      },
      error => {
        showToast('Erreur lors de l\'envoi du message');
        console.log('Erreur:', error);
      }
    );
  } else {
    // Si EmailJS n'est pas configuré, afficher un message
    showToast('Service de messagerie non configuré');
  }
}

function handleFormSubmit(e) {
  e.preventDefault();
  showToast('Message envoyé avec succès!');
  document.querySelector('.contact-form').reset();

  // Soumettre le formulaire à Formspree après le délai du toast
  setTimeout(() => {
    document.querySelector('.contact-form').submit();
  }, 1500);
}
