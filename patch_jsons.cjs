const fs = require('fs');

function updateJSON(file, updates) {
  const content = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  if (!content.contact) content.contact = {};
  if (!content.cart) content.cart = {};
  if (!content.app) content.app = {};
  if (!content.tourDetail) content.tourDetail = {};
  
  for (const [key, val] of Object.entries(updates.contact)) {
    content.contact[key] = val;
  }
  for (const [key, val] of Object.entries(updates.cart)) {
    content.cart[key] = val;
  }
  for (const [key, val] of Object.entries(updates.app)) {
    content.app[key] = val;
  }
  for (const [key, val] of Object.entries(updates.tourDetail)) {
    content.tourDetail[key] = val;
  }
  
  fs.writeFileSync(file, JSON.stringify(content, null, 2));
}

updateJSON('./src/locales/en.json', {
  contact: {
    talkTitle: "Let's Talk",
    heroTitle: "24/7 Support Desk",
    phoneTitle: "Phone Line",
    phoneAvailability: "24/7 Availability",
    whatsappTitle: "WhatsApp Live Support",
    whatsappAvailability: "24/7 Support and Bookings",
    messageLabel: "Message",
    newMessageBtn: "Send a New Message",
    successTitle: "Message Sent Successfully!",
    sendingBtn: "Sending message..."
  },
  cart: {
    noneSelected: "No excursions selected"
  },
  app: {
    homeTitle: "Tano Excursions | Tours in Punta Cana",
    catalogTitle: "Excursions Catalog | Tano Excursions",
    contactTitle: "Contact | Tano Excursions"
  },
  tourDetail: {
    stars: "{{count}} Stars"
  }
});

updateJSON('./src/locales/es.json', {
  contact: {
    talkTitle: "Hablemos",
    heroTitle: "Centro de Soporte 24/7",
    phoneTitle: "Central Telefónica",
    phoneAvailability: "Disponibilidad 24/7",
    whatsappTitle: "Contacto por WhatsApp",
    whatsappAvailability: "Asistencia y Reservas 24/7",
    messageLabel: "Mensaje",
    newMessageBtn: "Enviar nuevo mensaje",
    successTitle: "¡Mensaje enviado exitosamente!",
    sendingBtn: "Enviando mensaje..."
  },
  cart: {
    noneSelected: "Ninguna excursión seleccionada"
  },
  app: {
    homeTitle: "Tano Excursions | Tours en Punta Cana",
    catalogTitle: "Catálogo de Excursiones | Tano Excursions",
    contactTitle: "Contacto | Tano Excursions"
  },
  tourDetail: {
    stars: "{{count}} Estrellas"
  }
});

updateJSON('./src/locales/fr.json', {
  contact: {
    talkTitle: "Parlons-en",
    heroTitle: "Centre d'Assistance 24/7",
    phoneTitle: "Téléphone",
    phoneAvailability: "Disponibilité 24/7",
    whatsappTitle: "Assistance WhatsApp",
    whatsappAvailability: "Assistance et Réservations 24/7",
    messageLabel: "Message",
    newMessageBtn: "Envoyer un nouveau message",
    successTitle: "Message envoyé avec succès!",
    sendingBtn: "Envoi du message..."
  },
  cart: {
    noneSelected: "Aucune excursion sélectionnée"
  },
  app: {
    homeTitle: "Tano Excursions | Tours à Punta Cana",
    catalogTitle: "Catalogue d'Excursions | Tano Excursions",
    contactTitle: "Contact | Tano Excursions"
  },
  tourDetail: {
    stars: "{{count}} Étoiles"
  }
});
