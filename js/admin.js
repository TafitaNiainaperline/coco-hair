// Charger les commandes au démarrage
window.addEventListener('DOMContentLoaded', () => {
  loadOrders();
  loadStats();
  loadSettings();
});

function loadOrders() {
  const orders = JSON.parse(localStorage.getItem('cocoHairOrders') || '[]');
  const ordersList = document.getElementById('ordersList');

  if (orders.length === 0) {
    ordersList.innerHTML = '<p class="loading">Aucune commande pour le moment</p>';
    return;
  }

  // Trier par date décroissante (plus récentes d'abord)
  orders.sort((a, b) => b.id - a.id);

  ordersList.innerHTML = orders.map((order, index) => {
    const itemNames = order.items.map(i => i.name).join(', ');
    const orderNumber = (orders.length - index).toString().padStart(4, '0');
    return `
    <div class="order-card" onclick="viewOrder(${order.id})">
      <div class="order-info">
        <div class="order-id">Commande #${orderNumber}</div>
        <div class="order-items">${itemNames}</div>
        <div class="order-details">
          <span>${order.customer.name}</span>
          <span>${order.customer.phone}</span>
          <span>${order.date}</span>
        </div>
      </div>
      <div class="order-total">${order.total.toLocaleString()} Ar</div>
      <div class="order-status">
        <span class="status-badge status-${order.status.split(' ')[0].toLowerCase()}">
          ${order.status}
        </span>
        <select class="status-select" onclick="event.stopPropagation(); updateOrderStatus(${order.id}, this.value)">
          <option value="">Changer statut</option>
          <option value="en attente de paiement">En attente</option>
          <option value="payé">Payé</option>
          <option value="expédié">Expédié</option>
          <option value="livré">Livré</option>
        </select>
      </div>
    </div>
  `;
  }).join('');
}

function viewOrder(orderId) {
  const orders = JSON.parse(localStorage.getItem('cocoHairOrders') || '[]');
  const order = orders.find(o => o.id === orderId);
  const orderIndex = orders.findIndex(o => o.id === orderId);

  if (!order) return;

  const itemsList = order.items.map(item => `
    <div class="item-row">
      <span>${item.name} × ${item.qty}</span>
      <span>${(item.price * item.qty).toLocaleString()} Ar</span>
    </div>
  `).join('');

  const deliveryLabel = order.delivery === 'express' ? 'Express (2-3 jours)' :
                       order.delivery === 'standard' ? 'Standard (5-7 jours)' : 'Retrait Fianarantsoa';

  const orderNumber = (orders.length - orderIndex).toString().padStart(4, '0');

  const detailHTML = `
    <h2>Commande #${orderNumber}</h2>

    <div class="order-detail-section">
      <h3>Client</h3>
      <div class="detail-row"><strong>Nom:</strong> <span>${order.customer.name}</span></div>
      <div class="detail-row"><strong>Téléphone:</strong> <span>${order.customer.phone}</span></div>
      <div class="detail-row"><strong>Ville:</strong> <span>${order.customer.city}</span></div>
    </div>

    <div class="order-detail-section">
      <h3>Articles</h3>
      <div class="items-list">${itemsList}</div>
    </div>

    <div class="order-detail-section">
      <h3>Livraison</h3>
      <div class="detail-row"><strong>Type:</strong> <span>${deliveryLabel}</span></div>
    </div>

    <div class="order-detail-section">
      <h3>Résumé</h3>
      <div class="detail-row"><strong>Sous-total:</strong> <span>${order.total.toLocaleString()} Ar</span></div>
      <div class="detail-row"><strong>Total:</strong> <span style="font-size:16px;color:var(--green-dark);font-weight:600;">${order.total.toLocaleString()} Ar</span></div>
    </div>

    <div class="order-detail-section">
      <h3>Statut actuel</h3>
      <select class="status-select" style="width:100%;padding:12px;font-size:14px;" onchange="updateOrderStatus(${order.id}, this.value)">
        <option value="en attente de paiement" ${order.status === 'en attente de paiement' ? 'selected' : ''}>En attente de paiement</option>
        <option value="payé" ${order.status === 'payé' ? 'selected' : ''}>Payé</option>
        <option value="expédié" ${order.status === 'expédié' ? 'selected' : ''}>Expédié</option>
        <option value="livré" ${order.status === 'livré' ? 'selected' : ''}>Livré</option>
      </select>
    </div>

    <div class="order-detail-section">
      <h3>Historique</h3>
      <div class="history-timeline">
        ${(order.history || []).map(entry => `
          <div class="history-item">
            <div class="history-status">${entry.status}</div>
            <div class="history-date">${entry.date}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="order-detail-section">
      <h3>Actions</h3>
      <button class="btn-primary" style="width:100%;margin-bottom:10px;" onclick="contactCustomer(${order.id})">
        Contacter le client
      </button>
      <button class="btn-secondary" style="width:100%;" onclick="deleteOrder(${order.id})">
        Supprimer
      </button>
    </div>
  `;

  document.getElementById('orderDetailContent').innerHTML = detailHTML;
  document.getElementById('orderModal').classList.add('active');
}

function closeOrderModal() {
  document.getElementById('orderModal').classList.remove('active');
}

function updateOrderStatus(orderId, newStatus) {
  if (!newStatus) return;

  const orders = JSON.parse(localStorage.getItem('cocoHairOrders') || '[]');
  const order = orders.find(o => o.id === orderId);

  if (order) {
    order.status = newStatus;

    // Ajouter à l'historique
    if (!order.history) order.history = [];
    order.history.push({
      status: newStatus,
      date: new Date().toLocaleString('fr-FR')
    });

    localStorage.setItem('cocoHairOrders', JSON.stringify(orders));
    loadOrders();
    loadStats();
    closeOrderModal();
    showToast(`Statut mis à jour: ${newStatus}`);
  }
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'admin-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function deleteOrder(orderId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) return;

  let orders = JSON.parse(localStorage.getItem('cocoHairOrders') || '[]');
  orders = orders.filter(o => o.id !== orderId);
  localStorage.setItem('cocoHairOrders', JSON.stringify(orders));
  loadOrders();
  loadStats();
  closeOrderModal();
}

function contactCustomer(orderId) {
  const orders = JSON.parse(localStorage.getItem('cocoHairOrders') || '[]');
  const orderIndex = orders.findIndex(o => o.id === orderId);
  const order = orders.find(o => o.id === orderId);

  if (!order) return;

  const orderNumber = (orders.length - orderIndex).toString().padStart(4, '0');
  const itemsList = order.items.map(i => `${i.name}`).join(', ');

  const statusMessages = {
    'en attente de paiement': 'En attente de votre paiement',
    'payé': 'Votre paiement a été reçu',
    'expédié': `Votre commande est expédiée`,
    'livré': 'Votre commande a été livrée'
  };

  const statusMessage = statusMessages[order.status] || order.status;

  const message = `Bonjour ${order.customer.name},

Votre commande #${orderNumber} (${itemsList}) ${statusMessage.toLowerCase()}.

Merci d'avoir choisi CocoHair!`;

  const phone = order.customer.phone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/261${phone.slice(-9)}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}

function filterOrders() {
  const status = document.getElementById('statusFilter').value;
  const orders = JSON.parse(localStorage.getItem('cocoHairOrders') || '[]');
  const filtered = status ? orders.filter(o => o.status === status) : orders;

  const ordersList = document.getElementById('ordersList');
  filtered.sort((a, b) => b.id - a.id);

  ordersList.innerHTML = filtered.map((order, index) => {
    const itemNames = order.items.map(i => i.name).join(', ');
    const orderNumber = (filtered.length - index).toString().padStart(4, '0');
    return `
    <div class="order-card" onclick="viewOrder(${order.id})">
      <div class="order-info">
        <div class="order-id">Commande #${orderNumber}</div>
        <div class="order-items">${itemNames}</div>
        <div class="order-details">
          <span>${order.customer.name}</span>
          <span>${order.customer.phone}</span>
          <span>${order.date}</span>
        </div>
      </div>
      <div class="order-total">${order.total.toLocaleString()} Ar</div>
      <div class="order-status">
        <span class="status-badge status-${order.status.split(' ')[0].toLowerCase()}">
          ${order.status}
        </span>
      </div>
    </div>
  `;
  }).join('');
}

function loadStats() {
  const orders = JSON.parse(localStorage.getItem('cocoHairOrders') || '[]');

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingCount = orders.filter(o => o.status === 'en attente de paiement').length;
  const paidCount = orders.filter(o => o.status === 'payé').length;

  let statsHTML = `
    <div class="stat-card">
      <div class="stat-icon">
        <img src="assets/statistics-svgrepo-com.svg" alt="Commandes">
      </div>
      <div class="stat-label">Commandes</div>
      <div class="stat-value">${totalOrders}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">
        <img src="assets/statistics-svgrepo-com.svg" alt="Revenus">
      </div>
      <div class="stat-label">Revenus</div>
      <div class="stat-value">${totalRevenue.toLocaleString()} Ar</div>
    </div>
  `;

  if (pendingCount > 0) {
    statsHTML += `
    <div class="stat-card">
      <div class="stat-icon">
        <img src="assets/statistics-svgrepo-com.svg" alt="En attente">
      </div>
      <div class="stat-label">En attente</div>
      <div class="stat-value pending">${pendingCount}</div>
    </div>
    `;
  }

  if (paidCount > 0) {
    statsHTML += `
    <div class="stat-card">
      <div class="stat-icon">
        <img src="assets/statistics-svgrepo-com.svg" alt="Payées">
      </div>
      <div class="stat-label">Payées</div>
      <div class="stat-value success">${paidCount}</div>
    </div>
    `;
  }

  document.getElementById('statsGrid').innerHTML = statsHTML;
}

function loadSettings() {
  const settings = JSON.parse(localStorage.getItem('cocoHairSettings') || '{}');
  document.getElementById('ownerPhone').value = settings.phone || '+261 34 70 20 583';
  document.getElementById('ownerEmail').value = settings.email || 'cocohair@mada.mg';
  document.getElementById('pickupCity').value = settings.city || 'Fianarantsoa';
}

function saveSettings() {
  const settings = {
    phone: document.getElementById('ownerPhone').value,
    email: document.getElementById('ownerEmail').value,
    city: document.getElementById('pickupCity').value
  };
  localStorage.setItem('cocoHairSettings', JSON.stringify(settings));
  alert('Paramètres enregistrés');
}

function showSection(sectionId) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  document.getElementById(sectionId + 'Section').classList.add('active');
  event.target.closest('.nav-item').classList.add('active');

  if (sectionId === 'stats') {
    loadStats();
  }
}

function refreshOrders() {
  loadOrders();
  alert('Commandes actualisées');
}

function exportOrdersPDF() {
  const orders = JSON.parse(localStorage.getItem('cocoHairOrders') || '[]');

  const htmlContent = `
    <h1 style="color: #1B3A2D; text-align: center; margin-bottom: 10px;">Rapport des Commandes</h1>
    <p style="text-align: center; color: #666; margin: 5px;">CocoHair Madagascar</p>
    <p style="text-align: center; color: #999; font-size: 12px; margin: 10px 0;">Date: ${new Date().toLocaleString('fr-FR')}</p>
    <p style="text-align: center; font-weight: bold; margin: 10px 0;">Total des commandes: ${orders.length}</p>

    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px;">
      <tr style="background: #1B3A2D; color: white;">
        <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">ID</th>
        <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Date</th>
        <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Client</th>
        <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Téléphone</th>
        <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Ville</th>
        <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Total</th>
        <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Statut</th>
      </tr>
      ${orders.map((order, index) => {
        const orderNumber = (orders.length - index).toString().padStart(4, '0');
        return `
      <tr style="background: ${index % 2 === 0 ? '#f9f9f9' : 'white'};">
        <td style="padding: 8px; border: 1px solid #ddd;">#${orderNumber}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${order.date}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${order.customer.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${order.customer.phone}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${order.customer.city}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${order.total.toLocaleString()} Ar</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${order.status}</td>
      </tr>`;
      }).join('')}
    </table>
  `;

  const element = document.createElement('div');
  element.innerHTML = htmlContent;

  const opt = {
    margin: 10,
    filename: `commandes-${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
  };

  html2pdf().set(opt).from(element).save();
}

function logout() {
  if (confirm('Êtes-vous sûr de vouloir vous déconnecter?')) {
    localStorage.removeItem('cocoHairUser');
    window.location.href = 'login.html';
  }
}

function toggleSidebar() {
  const sidebar = document.querySelector('.admin-sidebar');
  const overlay = document.querySelector('.admin-sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
}

// Fermer sidebar quand on clique sur un lien
document.addEventListener('DOMContentLoaded', () => {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const sidebar = document.querySelector('.admin-sidebar');
      const overlay = document.querySelector('.admin-sidebar-overlay');
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  });
});
