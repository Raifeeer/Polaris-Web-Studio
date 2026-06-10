const fs = require('fs');

function updateLocale(file, data) {
  const content = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  // Merge deep
  function md(t, s) {
    for (let k in s) {
      if (typeof s[k] === 'object' && s[k] !== null && !Array.isArray(s[k])) {
        if (!t[k]) t[k] = {};
        md(t[k], s[k]);
      } else {
        t[k] = s[k];
      }
    }
  }
  md(content, data);
  fs.writeFileSync(file, JSON.stringify(content, null, 2));
}

const en = {
  auth: { errors: { nameRequired: "Username is required", passwordMin: "Password must be at least 6 characters", generic: "An error occurred during authentication.", emailInUse: "This email is already registered.", invalidCredential: "Email or password incorrect.", invalidEmail: "The email entered is invalid.", userNotFound: "No account found with this email.", googleError: "Error logging in with Google." }, emailPlaceholder: "email@example.com", hidePassword: "Hide Password", showPassword: "Show Password" },
  tour: { errors: { selectDate: "Please select a travel date first.", blockedDate: "The selected date has been blocked by the administrator.", capacityExceeded: "The number of attendees ({{attendees}}) exceeds the remaining spots ({{spots}}) for this date.", noSpots: "The selected date has no available spots.", nameRequired: "Please enter your full name (minimum 3 characters).", emailRequired: "Please enter a valid email address (e.g., user@domain.com).", phoneRequired: "Please enter a valid mobile phone number.", reservationError: "There was an error processing your reservation. Please try again or contact us via WhatsApp.", paypalDelayed: "Payment processed successfully on PayPal (${{price}}), but there was a delay updating your status. Please save this receipt code: {{id}} and contact us." } },
  cart: { emptyDesc: "You don't have any excursions in your cart yet. Explore our catalog and start planning your next adventure." },
  checkout: { whatsappBuyer: "WhatsApp Buyer", notProvided: "Not provided" },
  notFound: { docTitle: "404 - Page Not Found", title: "That adventure does not exist!", desc: "It seems this page got lost in the Caribbean. 🌊", homeBtn: "Go to Home" },
  terms: {
    subtitle: "Legal Aspects", title: "Terms and Conditions", description: "By booking any excursion with Tano Excursions, you agree to comply with the following policies and guidelines to ensure a safe experience.",
    t1: "1. Bookings & Confirmation",
    d1_1: "All booking requests made on our website or through our official channels are safe and immediate. However, we process a final confirmation verifying hotel or transport availability to guarantee our service standards.",
    d1_2: "Once payment is completed (partial or total), you will receive a digital voucher in your email. This voucher must be available in printed or digital format at pickup time.",
    t2: "2. Cancellations & Refunds",
    d2: "We understand travel plans can change unexpectedly in the Caribbean. For this reason, we provide the following flexible cancellation policies:",
    l2_1: "<strong class=\"text-tano-blue-900\">Cancellations before 24 hours:</strong> Full 100% refund of the amount paid.",
    l2_2: "<strong class=\"text-tano-blue-900\">Cancellations within 24 hours:</strong> Considered late cancellation, with a 50% penalty charge, or free rescheduling.",
    l2_3: "<strong class=\"text-tano-blue-900\">No-Show:</strong> Failure to arrive at the lobby at the designated voucher pickup time yields no refund.",
    t3: "3. Force Majeure & Weather Conditions",
    d3_1: "Our maritime tours (such as Saona Island or Catalinitas) are subject to Dominican Republic Navy regulations to protect sea travelers. If severe weather prevents departure:",
    d3_2: "An immediate rescheduling of the tour date will be offered. In case your return flight schedule prevents changing the date, Tano Excursions will issue a quick, transparent 100% refund.",
    t4: "4. Safety, Health & Guidelines",
    d4_1: "Our tour guides are certified professionals. Customers commit to wearing the designated life jackets and protective equipment mandatory on every tour.",
    d4_2: "It is the user's responsibility to report any limiting health conditions (pregnancy, heart problems, reduced mobility, or severe allergies) prior to boarding. The administrator guide has the authority to suspend boarding for any passenger showing signs of heavy intoxication or hostile behavior.",
    qTitle: "Got any questions on our service policies?",
    qDesc: "Our customer support team is always standing by to answer any legal, billing, or technical inquiries.",
    qBtn: "Ask on WhatsApp"
  },
  privacy: {
    subtitle: "Secure Data", title: "Privacy Policy", description: "Your privacy is an absolute priority for Tano Excursions. This page transparently explains how we handle the information you provide.",
    t1: "1. Personal Data We Collect",
    d1: "By utilizing our services, we exclusively collect necessary operational data:",
    l1_1: "Full Names, Phone Numbers, and Email to manage your reservation.",
    l1_2: "Accommodation details (Hotel or Airbnb) for pickups.",
    t2: "2. How We Use Informative Data",
    d2: "Information is used exclusively for internal operations, such as:",
    l2_1: "Confirmation of pickup times via WhatsApp or Email.",
    l2_2: "Occasional deployment of newsletters or updates on upcoming tours, only if you subscribe.",
    t3: "3. Protections & Safeguards",
    d3: "Our platform features 256-bit SSL encryption. Furthermore, we actively use trusted external processors like PayPal to handle financial transactions. Therefore, we do not directly store any of your credit card details on our servers.",
    t4: "4. Sharing Information Safely",
    d4: "We do not sell, rent or maliciously exchange your personal data with unsolicited third-party entities. The only occasion we share details is directly with the respective transportation or tour operators (logistics providers) executing your excursion.",
    qTitle: "Want to update or remove some details?",
    qDesc: "If you need to view, fix, or remove any personal data associated with your bookings, please contact us immediately.",
    qBtn: "WhatsApp Privacy Support"
  }
};

const es = {
  auth: { errors: { nameRequired: "El nombre de usuario es obligatorio", passwordMin: "La contraseña debe tener al menos 6 caracteres", generic: "Ocurrió un error al autenticar.", emailInUse: "Este correo electrónico ya está registrado.", invalidCredential: "El correo electrónico o la contraseña son incorrectos.", invalidEmail: "El correo electrónico ingresado no es válido.", userNotFound: "No se encontró ninguna cuenta con este correo electrónico.", googleError: "Error al iniciar sesión con Google." }, emailPlaceholder: "correo@ejemplo.com", hidePassword: "Ocultar Contraseña", showPassword: "Mostrar Contraseña" },
  tour: { errors: { selectDate: "Por favor selecciona una fecha de viaje primero.", blockedDate: "La fecha seleccionada ha sido bloqueada por el administrador.", capacityExceeded: "La cantidad de personas ({{attendees}}) supera los cupos restantes disponibles ({{spots}}) para esta fecha.", noSpots: "La fecha seleccionada no tiene cupos disponibles.", nameRequired: "Por favor introduce tu nombre completo.", emailRequired: "Por favor introduce un correo electrónico válido.", phoneRequired: "Por favor introduce un número de teléfono celular correcto.", reservationError: "Hubo un error al procesar tu reserva. Inténtalo de nuevo o contáctanos por WhatsApp directamente.", paypalDelayed: "Pago procesado exitosamente en PayPal (${{price}}), pero hubo un retraso actualizando su estado. Guarde este código de recibo: {{id}} y contáctenos." } },
  cart: { emptyDesc: "Aún no tienes excursiones en tu carrito. Explora nuestro catálogo y empieza a planear tu próxima aventura." },
  checkout: { whatsappBuyer: "Comprador WhatsApp", notProvided: "No proporcionado" },
  notFound: { docTitle: "404 - Página no encontrada", title: "¡Esa aventura no existe!", desc: "Parece que esta página se perdió en el Caribe. 🌊", homeBtn: "Volver al Inicio" },
  terms: {
    subtitle: "Aspectos Legales", title: "Términos y Condiciones", description: "Al reservar cualquier excursión con Tano Excursions, aceptas cumplir con las siguientes políticas y lineamientos.",
    t1: "1. Reservas y Confirmación de Tours",
    d1_1: "Todas las solicitudes de reserva realizadas en nuestro sitio web o a través de nuestros canales oficiales son seguras e inmediatas. Sin embargo, procesamos una confirmación final verificando la disponibilidad hotelera o de transporte para garantizar el estándar de servicio.",
    d1_2: "Una vez completado el pago (parcial o definitivo), recibirás un voucher o boleto digital en tu correo electrónico. Este voucher debe estar disponible en formato impreso o digital al momento de la recogida en tu hotel.",
    t2: "2. Cancelaciones y Reembolsos Civiles",
    d2: "Entendemos que los planes de viaje pueden cambiar de forma imprevista en el Caribe. Por esta razón, disponemos de las siguientes reglas flexibles de cancelación:",
    l2_1: "<strong class=\"text-tano-blue-900\">Cancelaciones antes de 24 horas:</strong> Reembolso total del 100% de la cantidad pagada.",
    l2_2: "<strong class=\"text-tano-blue-900\">Cancelaciones con menos de 24 horas:</strong> Se considera una cancelación tardía, con cargo de un 50% de penalización o reprogramación del día de la excursión sin costo adicional.",
    l2_3: "<strong class=\"text-tano-blue-900\">No-Show o Incomparecencia:</strong> No presentarse en el lobby del hotel a la hora establecida en el voucher no otorga derecho a reembolso.",
    t3: "3. Condiciones de Fuerza Mayor y Clima",
    d3_1: "Nuestros tours marítimos (como Isla Saona o Catalinitas) están sujetos a regulaciones de la Armada de la República Dominicana para velar por la vida humana. Si una autoridad portuaria prohíbe el zarpe por mal clima, tormenta o marejada extrema:",
    d3_2: "Se ofrecerá la reprogramación inmediata de la fecha del tour. En caso de que tu plan de vuelo de retorno impida cambiar la fecha, Tano Excursions otorgará el reembolso del 100% de la reserva de forma ágil y transparente.",
    t4: "4. Seguridad, Salud y Normas del Cliente",
    d4_1: "Nuestros guías turísticos son profesionales certificados. El cliente se compromete a usar de forma obligatoria los chalecos salvavidas y equipamiento de seguridad indicados en cada tour.",
    d4_2: "Es responsabilidad del usuario informar sobre cualquier condición médica limitante (embarazo, problemas cardíacos, movilidad reducida o alergias severas) antes de abordar. El guía administrador cuenta con autoridad absoluta de suspender el abordaje en caso de que un cliente muestre signos de embriaguez o conductas hostiles que pongan en peligro al resto del grupo.",
    qTitle: "¿Tienes más consultas sobre nuestras pólizas de servicio?",
    qDesc: "Nuestro departamento corporativo y de atención al cliente está siempre listo para resolver cualquier duda jurídica, de facturación o técnica.",
    qBtn: "Preguntar por WhatsApp"
  },
  privacy: {
    subtitle: "Datos Seguros", title: "Política de Privacidad", description: "Tu privacidad es una prioridad absoluta en Tano Excursions. En esta página te explicamos de manera transparente cómo manejamos la información.",
    t1: "1. Datos Personales que Recopilamos",
    d1: "Al interactuar con nuestros servicios de reserva, únicamente solicitamos la información necesaria:",
    l1_1: "Nombres y apellidos, Números de teléfono y Correo para gestionar tu reserva.",
    l1_2: "Datos de alojamiento (Hotel, Resort o Airbnb) para coordinar las recogidas.",
    t2: "2. Uso de tu Información",
    d2: "La información recabada se emplea de forma exclusiva para fines operativos y de servicio:",
    l2_1: "Confirmación de horarios de recogida vía WhatsApp o Correo.",
    l2_2: "Notificaciones o boletines promocionales de próximas excursiones.",
    t3: "3. Medidas de Protección y Seguridad",
    d3: "Nuestra plataforma web cuenta con conexiones cifradas (SSL 256 bits). Además, delegamos el procesamiento financiero a proveedores externos de total confianza como PayPal o procesadores bancarios directos; no guardamos, retenemos ni almacenamos visualmente los datos de tu tarjeta.",
    t4: "4. Compartir Información con Terceros",
    d4: "No vendemos, alquilamos ni divulgamos maliciosamente tus datos personales a empresas de terceros no relacionadas. El único escenario de transferencia ocurre con los Proveedores Receptivos o Turoperadores logísticos a cargo de tu excursión.",
    qTitle: "¿Quieres corregir o eliminar algún dato de tu reserva?",
    qDesc: "Si deseas visualizar, modificar o remover parcialmente cualquier dato personal ligado a tus reservas, por favor contáctanos de manera expresa e inmediata.",
    qBtn: "Soporte de Privacidad de Datos"
  }
};

const fr = {
  auth: { errors: { nameRequired: "Le nom d'utilisateur est requis", passwordMin: "Le mot de passe doit contenir au moins 6 caractères", generic: "Une erreur s'est produite lors de l'authentification.", emailInUse: "Cet e-mail est déjà enregistré.", invalidCredential: "Email ou mot de passe incorrect.", invalidEmail: "L'e-mail saisi est invalide.", userNotFound: "Aucun compte trouvé avec cet e-mail.", googleError: "Erreur lors de la connexion avec Google." }, emailPlaceholder: "email@exemple.com", hidePassword: "Cacher le mot de passe", showPassword: "Afficher le mot de passe" },
  tour: { errors: { selectDate: "Veuillez d'abord sélectionner une date de voyage.", blockedDate: "La date sélectionnée a été bloquée par l'administrateur.", capacityExceeded: "Le nombre de participants ({{attendees}}) dépasse les places restantes ({{spots}}).", noSpots: "La date sélectionnée n'a pas de places disponibles.", nameRequired: "Veuillez entrer votre nom complet.", emailRequired: "Veuillez entrer une adresse e-mail valide.", phoneRequired: "Veuillez entrer un numéro de téléphone mobile valide.", reservationError: "Une erreur est survenue lors de la réservation.", paypalDelayed: "Paiement traité avec succès sur PayPal (${{price}}), mais il y a eu un retard de mise à jour. Veuillez conserver ce code de reçu : {{id}} et nous contacter." } },
  cart: { emptyDesc: "Vous n'avez pas encore d'excursions dans votre panier. Explorez notre catalogue et commencez à planifier votre prochaine aventure." },
  checkout: { whatsappBuyer: "Acheteur WhatsApp", notProvided: "Non fourni" },
  notFound: { docTitle: "404 - Page Non Trouvée", title: "Cette aventure n'existe pas !", desc: "Il semble que cette page se soit perdue dans les Caraïbes. 🌊", homeBtn: "Retour à l'accueil" },
  terms: {
    subtitle: "Aspects Légaux", title: "Termes & Conditions", description: "En réservant une excursion avec Tano Excursions, vous acceptez de vous conformer aux politiques et directives suivantes.",
    t1: "1. Réserves & Confirmation",
    d1_1: "Toutes les demandes de réservation effectuées sur notre site web ou via nos canaux officiels sont sécurisées et immédiates. Cependant, nous traitons une confirmation finale vérifiant la disponibilité des hôtels ou des transports pour garantir les normes de service.",
    d1_2: "Une fois le paiement effectué (partiel ou total), vous recevrez un bon numérique dans votre boîte de réception. Ce bon doit être disponible en format imprimé ou numérique lors de la prise en charge.",
    t2: "2. Annulations & Remboursements",
    d2: "Nous comprenons que les projets de voyage peuvent changer de manière imprévue dans les Caraïbes. Pour cette raison, nous mettons à votre disposition les annulations flexibles suivantes :",
    l2_1: "<strong class=\"text-tano-blue-900\">Annulations plus de 24h à l'avance :</strong> Remboursement intégral de 100 % du montant payé.",
    l2_2: "<strong class=\"text-tano-blue-900\">Annulations à moins de 24h :</strong> Annulation tardive, entraînant des frais de 50 % ou report sans frais.",
    l2_3: "<strong class=\"text-tano-blue-900\">Non-présentation (No-Show) :</strong> Aucune présentation au point de RDV convenu ne donne droit à un remboursement.",
    t3: "3. Force Majeure & Météo",
    d3_1: "Nos excursions maritimes sont soumises aux réglementations de la Marine pour assurer la sécurité de tous. Si les autorités interdisent le départ à cause de la météo :",
    d3_2: "Un report de date immédiat sera proposé. Si la date de votre vol retour ne permet pas ce report, Tano Excursions procédera au remboursement transparent de 100%.",
    t4: "4. Sécurité & Santé",
    d4_1: "Nos guides touristiques sont des professionnels qualifiés. Le voyageur s'engage à porter obligatoirement le gilet de sauvetage et les équipements de protection requis.",
    d4_2: "Il est de la responsabilité du voyageur de signaler tout état médical limitant (grossesse, troubles cardiaques, mobilité réduite ou allergies graves). Le guide se réserve le droit de refuser l'embarquement à toute personne agressive ou en état d'ébriété.",
    qTitle: "Des questions sur notre politique de service ?",
    qDesc: "Notre équipe d'assistance clientèle se tient à votre entière disposition pour répondre à toutes vos interrogations légales, de facturation ou techniques.",
    qBtn: "Poser une question sur WhatsApp"
  },
  privacy: {
    subtitle: "Données Sécurisées...", title: "Politique de Confidentialité", description: "Votre vie privée est une de nos priorités. Sur cette page, nous expliquons de manière transparente comment la société manipule vos informations.",
    t1: "1. Données Personnelles Collectées",
    d1: "En utilisant nos services de réservation, nous demandons uniquement les informations nécessaires :",
    l1_1: "Noms et prénoms, Numéro de téléphone et Email pour l'organisation.",
    l1_2: "Détails d'hébergement (Hôtel ou Airbnb) pour la collecte.",
    t2: "2. Utilisation des Informations",
    d2: "Vos données sont utilisées exclusivement à des fins de services opérationnels :",
    l2_1: "Confirmation des heures de prise en charge par WhatsApp ou Email.",
    l2_2: "Envois occasionnels d'offres promotionnelles si vous êtes inscrit volontairement à la Newsletter.",
    t3: "3. Mesures de Protection",
    d3: "Toutes nos transactions financières en ligne sont effectuées via des processeurs sécurisés par le chiffrement 256 bits et via PayPal. Nous ne stockons en aucun cas vos coordonnées complètes de cartes bancaires sur nos bases de données.",
    t4: "4. Partage d'Informations",
    d4: "Nous ne vendons, ni ne partageons vos données avec des tiers externes. Nous divulguons des informations identifiables exclusivement aux partenaires directs pour exécuter votre service (ex: le transporteur pour venir vous chercher).",
    qTitle: "Souhaitez-vous modifier ou retirer certaines données ?",
    qDesc: "Si vous souhaitez visualiser, ajuster ou supprimer certaines des données de profil liées à une de vos réservations, contactez-nous directement.",
    qBtn: "Soutien juridique de confidentialité"
  }
};

updateLocale('./src/locales/en.json', en);
updateLocale('./src/locales/es.json', es);
updateLocale('./src/locales/fr.json', fr);
