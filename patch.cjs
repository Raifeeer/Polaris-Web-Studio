const fs = require('fs');

const file = 'src/views/Contact.tsx';
let source = fs.readFileSync(file, 'utf8');

source = source.replace(
  /\{i18n\.language\.startsWith\("en"\)\s*\?\s*"Let's Talk"\s*:\s*i18n\.language\.startsWith\("fr"\)\s*\?\s*"Parlons-en"\s*:\s*"Hablemos"\}/g,
  '{t("contact.talkTitle")}'
);

source = source.replace(
  /\{i18n\.language\.startsWith\("en"\)\s*\?\s*"24\/7 Support Desk"\s*:\s*i18n\.language\.startsWith\("fr"\)\s*\?\s*"Centre d'Assistance 24\/7"\s*:\s*"Centro de Soporte 24\/7"\}/g,
  '{t("contact.heroTitle")}'
);

source = source.replace(
  /\{i18n\.language\.startsWith\("en"\)\s*\?\s*"Phone Line"\s*:\s*i18n\.language\.startsWith\("fr"\)\s*\?\s*"Téléphone"\s*:\s*"Central Telefónica"\}/g,
  '{t("contact.phoneTitle")}'
);

source = source.replace(
  /\{i18n\.language\.startsWith\("en"\)\s*\?\s*"24\/7 Availability"\s*:\s*i18n\.language\.startsWith\("fr"\)\s*\?\s*"Disponibilité 24\/7"\s*:\s*"Disponibilidad 24\/7"\}/g,
  '{t("contact.phoneAvailability")}'
);

source = source.replace(
  /\{i18n\.language\.startsWith\("en"\)\s*\?\s*"WhatsApp Live Support"\s*:\s*i18n\.language\.startsWith\("fr"\)\s*\?\s*"Assistance WhatsApp"\s*:\s*"Contacto por WhatsApp"\}/g,
  '{t("contact.whatsappTitle")}'
);

source = source.replace(
  /\{i18n\.language\.startsWith\("en"\)\s*\?\s*"24\/7 Support and Bookings"\s*:\s*i18n\.language\.startsWith\("fr"\)\s*\?\s*"Assistance et Réservations 24\/7"\s*:\s*"Asistencia y Reservas 24\/7"\}/g,
  '{t("contact.whatsappAvailability")}'
);

source = source.replace(
  /\{t\("contact\.messagePlaceholder"\)\.includes\("assist"\)\s*\?\s*"Your Message"\s*:\s*t\("contact\.messagePlaceholder"\)\.includes\("aider"\)\s*\?\s*"Votre Message"\s*:\s*"Tu Mensaje"\}/g,
  '{t("contact.messageLabel")}'
);

source = source.replace(
  /\{t\("contact\.subtitle"\)\.includes\("Got"\)\s*\?\s*"Send a New Message"\s*:\s*t\("contact\.subtitle"\)\.includes\("doutes"\)\s*\?\s*"Envoyer un nouveau message"\s*:\s*"Enviar nuevo mensaje"\}/g,
  '{t("contact.newMessageBtn")}'
);

source = source.replace(
  /\{t\("contact\.successMsg"\)\.includes\("received"\)\s*\?\s*"Message Sent Successfully!"\s*:\s*"¡Mensaje enviado exitosamente!"\}/g,
  '{t("contact.successTitle")}'
);

source = source.replace(
  /t\("contact\.submitBtn"\)\.includes\("Send"\)\s*\?\s*"Sending message\.\.\."\s*:\s*t\("contact\.submitBtn"\)\.includes\("Envoyer"\)\s*\?\s*"Envoi du message\.\.\."\s*:\s*"Enviando mensaje\.\.\."/g,
  't("contact.sendingBtn")'
);

// Bug 2: Cart.tsx noneSelected
const cartFile = 'src/views/Cart.tsx';
let cartSource = fs.readFileSync(cartFile, 'utf8');
cartSource = cartSource.replace(
  /\{t\("cart\.clearCartBtn"\)\s*===\s*"Clear Cart"\s*\?\s*"No excursions selected"\s*:\s*t\("cart\.clearCartBtn"\)\s*===\s*"Vider le panier"\s*\?\s*"Aucune excursion sélectionnée"\s*:\s*"Ninguna excursión seleccionada"\}/g,
  '{t("cart.noneSelected")}'
);
fs.writeFileSync(cartFile, cartSource);

// Bug 3: Checkout.tsx fragile checking
const checkoutFile = 'src/views/Checkout.tsx';
let checkoutSource = fs.readFileSync(checkoutFile, 'utf8');
checkoutSource = checkoutSource.replace(
  /const isEn = t\("cart\.clearCartBtn"\) === "Clear Cart";/g,
  'const isEn = i18n.language.startsWith("en");'
);
checkoutSource = checkoutSource.replace(
  /const isFr = t\("cart\.clearCartBtn"\) === "Vider le panier";/g,
  'const isFr = i18n.language.startsWith("fr");'
);
fs.writeFileSync(checkoutFile, checkoutSource);

// Bug 7: TourDetail.tsx title
const tourFile = 'src/views/TourDetail.tsx';
let tourSource = fs.readFileSync(tourFile, 'utf8');
tourSource = tourSource.replace(
  /title=\{\`\$\{stars\} Estrellas\`\}/g,
  'title={t("tourDetail.stars", { count: stars })}'
);
fs.writeFileSync(tourFile, tourSource);


fs.writeFileSync(file, source);
