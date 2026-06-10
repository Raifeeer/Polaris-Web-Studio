import dotenv from "dotenv";
dotenv.config({ override: true });
import express from "express";
import path from "path";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { createServer as createViteServer } from "vite";

// API endpoints
import excursionsList from "./api/excursions";
import excursionsDetail from "./api/excursions/[id]";
import excursionsCapacity from "./api/excursions/[id]/capacity";
import excursionsReviews from "./api/excursions/[id]/reviews";
import reservationsPost from "./api/reservations";
import reservationsUser from "./api/reservations/user/[email]";
import adminReservationsList from "./api/admin/reservations";
import adminReviews from "./api/admin/reviews";
import adminUsers from "./api/admin/users";
import contactPost from "./api/contact";
import adminCommand from "./api/admin/command";
import adminRoles from "./api/admin/roles";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust the first proxy to allow accurate IP tracking for express-rate-limit
  app.set("trust proxy", 1);

  // Configure CORS
  app.use(cors({
    origin: '*', // Allows all origins. For production, specify your domain (e.g., origin: 'https://mydomain.com')
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  }));

  // Configure Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: 'Too many requests, please try again later.' }
  });

  // Apply the rate limiting middleware to API calls only
  app.use('/api', apiLimiter);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Custom routing to match Vercel's file-based routing
  app.all("/api/excursions", (req, res) => excursionsList(req as any, res as any));
  app.all("/api/excursions/:id", (req, res) => {
    req.query.id = req.params.id;
    return excursionsDetail(req as any, res as any);
  });
  app.all("/api/excursions/:id/capacity", (req, res) => {
    req.query.id = req.params.id;
    return excursionsCapacity(req as any, res as any);
  });
  app.all("/api/excursions/:id/reviews", (req, res) => {
    req.query.id = req.params.id;
    return excursionsReviews(req as any, res as any);
  });
  app.all("/api/reservations", (req, res) => reservationsPost(req as any, res as any));
  app.all("/api/reservations/:id", (req, res) => {
    req.query.id = req.params.id;
    return reservationsPost(req as any, res as any);
  });
  app.all("/api/reservations/user/:email", (req, res) => {
    req.query.email = req.params.email;
    return reservationsUser(req as any, res as any);
  });
  
  app.all("/api/admin/reservations", (req, res) => adminReservationsList(req as any, res as any));
  app.all("/api/admin/reservations/:id", (req, res) => {
    req.query.id = req.params.id;
    return adminReservationsList(req as any, res as any);
  });
  app.all("/api/admin/reviews", (req, res) => adminReviews(req as any, res as any));
  app.all("/api/admin/users", (req, res) => adminUsers(req as any, res as any));
  app.all("/api/admin/command", (req, res) => adminCommand(req as any, res as any));
  app.all("/api/admin/roles", (req, res) => adminRoles(req as any, res as any));
  app.all("/api/admin/roles/transfer", (req, res) => adminRoles(req as any, res as any));

  app.all("/api/contact", (req, res) => contactPost(req as any, res as any));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const fs = require('fs');
    app.use(express.static(distPath, { index: false })); // Stop static middleware from serving index.html
    
    app.get('*', async (req, res) => {
      let html = "";
      try {
        html = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
      } catch (err) {
        return res.status(500).send("index.html not found");
      }
      
      if (req.path.startsWith('/tour/')) {
        const id = req.path.split('/')[2];
        try {
          const apiRes = await fetch(`http://127.0.0.1:${PORT}/api/excursions/${id}`);
          if (apiRes.ok) {
            const excursion = await apiRes.json();
            const title = `${excursion.name} | Tano Excursions`;
            const desc = (excursion.shortDescription || excursion.description || '').substring(0, 160).replace(/"/g, '&quot;');
            const image = excursion.image || '';
            
            html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
            html = html.replace(/<meta property="og:title" content=".*?"\s*\/>/, `<meta property="og:title" content="${title}" />`);
            html = html.replace(/<meta property="og:description" content=".*?"\s*\/>/, `<meta property="og:description" content="${desc}" />`);
            html = html.replace(/<meta name="description" content=".*?"\s*\/>/, `<meta name="description" content="${desc}" />`);
            if (image) {
              html = html.replace('</head>', `<meta property="og:image" content="${image}" />\n</head>`);
              html = html.replace('</head>', `<meta name="twitter:image" content="${image}" />\n</head>`);
              html = html.replace('</head>', `<meta name="twitter:card" content="summary_large_image" />\n</head>`);
            }
          }
        } catch (e) {
          console.error("Error setting dynamic SEO:", e);
        }
      }
      
      res.send(html);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
