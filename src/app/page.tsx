"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  ShoppingBag,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  X,
  Upload,
  Download,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Tag,
} from "lucide-react";

// interface ProductItem {
//   id: string;
//   title: string;
//   category: string;
//   fit?: string | null;
//   price: number;
//   tags: string[];
//   priceFormatted: string;
//   oldPrice: string;
//   discount: string;
//   rating: number;
//   reviewsCount: number;
//   sku: string;
//   image: string;
//   description: string;
//   badge: string;
// }

interface ProductItem {
  id: string;
  title: string;
  category: string;
  price: number;
  priceFormatted: string;
  oldPrice?: string;
  discount?: string;
  rating: number;
  reviewsCount: number;
  sku: string;
  image: string;
  tags: string[];
  description: string; // User-facing description (Persian)
  fit: string; // For buildVtonPrompt (fit tag)
  promptDescription: string; // Authoritative catalog description for buildVtonPrompt
  badge?: string;
}

const PRODUCTS: ProductItem[] = [
  {
    id: "outfit-1",
    title: "ست ۳ تکه کژوال پیراهن لنین یاسی، تی‌شرت پنبه و شلوار کتان شیری",
    category:
      "textured lavender overshirt + white crew-neck t-shirt + relaxed off-white drawstring pants + white low-top sneakers",
    price: 5130000,
    priceFormatted: "۵,۱۳۰,۰۰۰",
    oldPrice: "۶,۳۸۰,۰۰۰",
    discount: "۲۰٪",
    rating: 4.9,
    reviewsCount: 68,
    sku: "SET-LILAC-01",
    image: "/garments/garment-1.jpg",
    fit: "relaxed straight fit",
    promptDescription:
      "Treat the outfit as four distinct wearable items: a light lavender textured long-sleeve button-front overshirt, a plain white crew-neck T-shirt underneath, relaxed straight-leg warm off-white/ecru drawstring pants, and white low-top lace-up sneakers with subtle light-gray side striping. The lavender overshirt has a relaxed, slightly loose silhouette with a conventional pointed shirt collar, full button placket, long sleeves rolled neatly to approximately the forearms, and a gently curved shirt hem. Keep the overshirt completely OPEN rather than buttoned, with the white T-shirt clearly visible underneath. Keep the white T-shirt untucked and naturally hanging below the open overshirt at the lower front; do not tuck it into the pants. The overshirt should fall freely over the waistband rather than being tucked. The pants have a comfortable relaxed straight-leg cut, a medium-to-high elasticized waist, an exposed matching drawstring tied at the front, and full-length legs. Keep the pants untucked and allow the hems to fall naturally toward the sneakers, with a very slight break and overlap over the upper shoe area rather than cropping above the footwear. The sneakers are clean white low-top lace-up athletic/casual shoes with white soles and subtle light-gray lateral stripe details. Preserve the lavender shirt as a pale cool lavender/lilac tone with visible irregular crinkled or puckered texture and soft matte fabric behavior; the material appears lightweight-to-medium weight, flexible, and naturally wrinkled rather than crisp or glossy. Preserve the T-shirt as solid clean white with a smooth lightweight cotton-knit appearance. Preserve the pants as warm ivory/off-white with a smooth matte woven cotton appearance, elastic waistband, matching drawcord, and minimal wrinkling. Preserve the sneakers as predominantly white with structured panels, white laces, white midsoles/outsoles, and restrained light-gray side accents. There is no visible text, lettering, graphic, logo, embroidery, or decorative typography on any of the garments or footwear; do not introduce any. Keep all garment proportions, colors, fabric textures, seams, buttons, collar shape, sleeve-roll position, drawstring construction, hems, and layering relationships faithful to the reference.",
    tags: [
      "3-piece complete outfit",
      "open pastel lilac linen overshirt",
      "plain white inner crewneck t-shirt",
      "relaxed cream linen drawstring trousers",
      "rolled-up sleeves",
      "untucked flowy drape",
      "retro white sneakers",
    ],
    description:
      "ست کژوال خنک شامل پیراهن لنین یاسی، زیرپیراهنی پنبه‌ای و شلوار کتان شیری با تن‌خور بسیار راحت.",
    badge: "پرفروش‌ترین فصل",
  },
  {
    id: "outfit-2",
    title: "ست استریت‌ویر تی‌شرت اورسایز آبی آسمانی و شلوار جین بگ زغالی",
    category:
      "oversized light-blue graphic t-shirt + wide-leg washed-black jeans + white low-top sneakers",
    price: 4520000,
    priceFormatted: "۴,۵۲۰,۰۰۰",
    oldPrice: "۵,۶۶۰,۰۰۰",
    discount: "۱۵٪",
    rating: 4.8,
    reviewsCount: 44,
    sku: "STR-BLUE-02",
    image: "/garments/garment-2.jpg",
    fit: "oversized relaxed",
    promptDescription:
      "Treat the outfit as three distinct wearable items: an oversized light-blue short-sleeve crew-neck T-shirt, wide-leg washed-black/charcoal jeans, and clean white low-top lace-up sneakers. The T-shirt has a relaxed oversized silhouette with broad shoulders, dropped shoulder seams, roomy short sleeves ending above the elbows, a ribbed crew neckline, and a straight slightly curved hem. Keep the T-shirt completely untucked and hanging freely OVER the jeans waistband, with the lower hem resting around the upper hip and partially covering the waistband; do not tuck, half-tuck, or crop the shirt. Preserve the natural loose drape and subtle bunching along the lower hem. The T-shirt is a soft pale sky-blue/cool powder-blue color with a smooth matte cotton-jersey appearance, medium-light visual weight, and gentle natural fabric folds rather than a stiff structure. On the center chest, reproduce the exact visible text 'RISE ABOVE' in uppercase, using a small thin modern sans-serif typeface in a pale white/light-gray tone; keep it subtle, horizontally centered, clean, and flat with no additional graphics or lettering. The jeans are relaxed wide-leg straight jeans in a deep washed charcoal/black tone, with a standard waistband, conventional front fly and pockets, roomy thighs, and a long straight leg that remains wide toward the ankle; preserve the slightly faded charcoal appearance and soft worn denim texture with restrained vertical and horizontal creasing. Keep the jeans worn normally at the waist beneath the untucked T-shirt. The jean hems extend fully to the footwear and sit directly over the tops of the sneakers with a slight natural break/stack at the ankle; do not cuff, crop, roll, or tuck the jeans into the shoes. The footwear consists of minimal white low-top lace-up sneakers with rounded toes, white laces, layered white leather/synthetic panels, and thick white rubber soles; maintain their clean monochromatic white appearance. Preserve the exact garment proportions, sleeve length, neckline, oversized volume, chest-text placement, blue color, denim wash, wide-leg silhouette, hem-to-shoe relationship, fabric weight, folds, seams, and overall styling without introducing additional accessories, graphics, logos, or text.",
    tags: [
      "2-piece streetwear outfit",
      "drop-shoulder oversized sky blue graphic tee",
      "heavyweight 280gsm cotton",
      "washed charcoal baggy wide-leg denim jeans",
      "untucked boxy silhouette",
      "chunky white sneakers",
    ],
    description:
      "استایل ترند لش با تی‌شرت ۲۸۰ گرم پنبه‌ای Rise Above به همراه جین بگ زغالی سنگ‌شور.",
    badge: "ترند اینستاگرام",
  },
  {
    id: "outfit-3",
    title: "پیراهن کلاسیک آکسفورد تمام پنبه آبی آسمانی (طرح پولو)",
    category: "light-blue embroidered button-down shirt",
    price: 3380000,
    priceFormatted: "۳,۳۸۰,۰۰۰",
    oldPrice: "۴,۲۵۰,۰۰۰",
    discount: "۲۱٪",
    rating: 5.0,
    reviewsCount: 92,
    sku: "SHIRT-OXF-03",
    image: "/garments/garment-3.jpg",
    fit: "regular relaxed",
    promptDescription:
      "Treat the garment as a single long-sleeve light-blue button-down shirt. Preserve its regular-to-relaxed silhouette with a straight, moderately roomy body, conventional shoulder construction, full-length sleeves rolled neatly to the forearms, and a curved shirttail hem. Use a classic button-down collar with pointed collar tips secured by small buttons; keep the collar flat and natural rather than popped. Keep the shirt worn as a single layer with no visible undershirt, and keep the front placket mostly buttoned with the upper neckline naturally open. Keep both sleeves rolled evenly to the forearms with clean folded cuffs; do not leave the sleeves fully extended. Preserve the pale cool powder-blue/light sky-blue color and smooth lightweight-to-medium-weight woven shirting fabric, with a fine subtle weave, matte surface, soft structure, natural vertical drape, and restrained wrinkles. On the wearer's left chest, reproduce the small dark navy/black embroidered equestrian polo-player emblem: a mounted rider on horseback holding a raised polo mallet. The emblem is a compact stitched embroidery directly on the shirt fabric, with no surrounding patch and no accompanying lettering. There is no visible textual wording on the garment, so add no text, slogans, typography, or additional graphics. Preserve the exact button placement, collar construction, rolled-sleeve position, curved hem, embroidery scale and chest placement, pale-blue color, fabric texture, seams, folds, drape, and overall proportions.",
    tags: [
      "standalone formal-casual shirt",
      "regular-fit Oxford cotton button-down",
      "sky blue color",
      "rolled-up cuffs",
      "unbuttoned collar",
      "structured tailored fit",
      "embroidered chest pony logo",
    ],
    description:
      "پیراهن اداری و مجلسی با پارچه ۱۰۰٪ آکسفورد ضدچروک با لوگوی گلدوزی ظریف پولو.",
    badge: "اصالت پارچه",
  },
  {
    id: "outfit-4",
    title: "ست مینیمال پیراهن نخی سبز پسته‌ای پاستلی همراه شلوار جین واید سفید",
    category:
      "pastel lime-green embroidered button-down shirt + high-rise straight-leg white jeans",
    price: 4860000,
    priceFormatted: "۴,۸۶۰,۰۰۰",
    oldPrice: "۶,۰۴۰,۰۰۰",
    discount: "۱۹٪",
    rating: 4.9,
    reviewsCount: 51,
    sku: "SET-LIME-04",
    image: "/garments/garment-3.png",
    fit: "relaxed regular fit",
    promptDescription:
      "Treat the outfit as two distinct garments: a pastel lime-green long-sleeve button-down shirt and high-rise white straight-leg five-pocket jeans. Preserve the shirt's relaxed regular silhouette, conventional shoulder construction, pointed spread/button-down-style collar, full front button placket, long sleeves, and gently curved shirttail hem. Keep the shirt visibly untucked and hanging freely over the waistband when worn; do not crop it or tuck it fully or partially. The shirt is styled with both sleeves rolled upward to the forearms, with substantial clean fabric folds forming soft rolled cuffs; keep the collar flat and naturally open at the neck rather than popped. Preserve the shirt as a pale yellow-green/lime pastel shade with a smooth, lightweight-to-medium-weight woven shirting fabric, soft matte finish, fine subtle weave, fluid natural drape, and gentle folds concentrated around the lower front, side seams, sleeves, and rolled cuffs. On the wearer's left chest, reproduce the small dark navy/black embroidered equestrian polo-player emblem, showing a mounted rider holding a raised mallet; render it as compact stitched embroidery directly into the fabric with no surrounding patch and no additional lettering. The inner neck label visibly contains the text 'LAUREN RALPH' in small dark lettering, with a smaller secondary line beneath it that is not sufficiently legible to reproduce confidently; treat this as a woven/printed garment label rather than exterior branding and do not invent the unreadable text. The jeans are clean solid white/off-white denim with a high-rise waistband, belt loops, button closure, zip fly, classic five-pocket construction, front rivets, roomy upper leg, and a straight relaxed leg continuing consistently from thigh to hem. Preserve the denim as medium-weight cotton denim with a smooth twill texture, structured but not rigid drape, minimal fading, and clean white coloration. Keep the jeans full length with straight hems; in a worn configuration, allow the hems to fall naturally toward the footwear with a clean slight break rather than cuffing, stacking heavily, or tucking into shoes. No footwear or accessories are present in the reference. Preserve the exact lime-green color, white denim tone, collar and button construction, sleeve-roll proportions, curved shirt hem, embroidered rider emblem, visible label placement, pocket architecture, waistband, seams, fabric texture, folds, and overall garment proportions without adding graphics, text, distressing, or accessories.",
    tags: [
      "2-piece minimalist outfit",
      "relaxed pastel pistachio green cotton shirt",
      "clean crisp white wide-leg denim jeans",
      "rolled-up sleeves",
      "loose breathable cotton drape",
    ],
    description:
      "ترکیب چشم‌نواز پیراهن سبک پاستلی سبز پسته‌ای با شلوار جین واید سفید یخچالی.",
    badge: "کالکشن جدید",
  },
];

interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
}

// ----------------- CANVAS "AI STITCHING" LOADER -----------------
// Theme: an AI thread-loom assembling a garment silhouette. Ties directly to
// what's actually happening (fabric being fitted to a body) instead of a
// generic spinner, and reuses the page's own palette (zinc-950 / blue-600 →
// indigo-600 / amber-300 spark) so it reads as part of the same product.
const LOOM_MESSAGES = [
  "در حال تحلیل تصویر شما...",
  "در حال شناسایی فرم و حالت بدن...",
  "در حال تطبیق نور و زاویه دوربین...",
  "در حال شبیه‌سازی افتادگی پارچه...",
  "در حال هماهنگ‌سازی رنگ و سایه‌ها...",
  "🧵 در حال دوختن جزئیات نهایی...",
  "در حال رندر تصویر نهایی...",
  "کمی بیشتر طول می‌کشد، در حال تکمیل ظرافت‌هاست...",
];

function TryOnLoadingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(6);

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 200; // logical CSS pixels
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const R = 42; // garment silhouette scale

    // Simple T-shirt silhouette as points relative to center, scaled by R
    const pts: [number, number][] = [
      [-0.15 * R, -0.92 * R], // neck left
      [-0.55 * R, -0.74 * R], // shoulder left
      [-0.95 * R, -0.32 * R], // sleeve left, outer
      [-0.56 * R, -0.12 * R], // sleeve left, inner
      [-0.5 * R, -0.02 * R], // underarm left
      [-0.5 * R, 0.9 * R], // hem left
      [0.5 * R, 0.9 * R], // hem right
      [0.5 * R, -0.02 * R], // underarm right
      [0.56 * R, -0.12 * R], // sleeve right, inner
      [0.95 * R, -0.32 * R], // sleeve right, outer
      [0.55 * R, -0.74 * R], // shoulder right
      [0.15 * R, -0.92 * R], // neck right
    ];
    const buildGarmentPath = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.quadraticCurveTo(0, -0.62 * R, pts[0][0], pts[0][1]);
      ctx.closePath();
    };

    const palette = ["59,130,246", "99,102,241", "99,102,241", "252,211,77"];
    const particles = Array.from({ length: 42 }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 58 + Math.random() * 38,
      speed: 0.15 + Math.random() * 0.35,
      size: 1 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
      hue: palette[Math.floor(Math.random() * palette.length)],
    }));

    const start = performance.now();
    let raf = 0;

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, size, size);

      // ambient pulsing glow
      const glowR = 70 + Math.sin(t * 1.2) * 6;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      glow.addColorStop(0, "rgba(79,70,229,0.35)");
      glow.addColorStop(1, "rgba(79,70,229,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();

      // outer rotating dashed ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.6);
      ctx.beginPath();
      ctx.setLineDash([6, 10]);
      ctx.lineDashOffset = -t * 30;
      ctx.strokeStyle = "rgba(96,165,250,0.55)";
      ctx.lineWidth = 1.5;
      ctx.arc(0, 0, 88, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // inner rotating ring, opposite direction
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-t * 0.9);
      ctx.beginPath();
      ctx.setLineDash([3, 8]);
      ctx.strokeStyle = "rgba(129,140,248,0.4)";
      ctx.lineWidth = 1;
      ctx.arc(0, 0, 74, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // orbiting thread particles
      particles.forEach((p) => {
        p.angle += p.speed * 0.02;
        const x = cx + Math.cos(p.angle) * p.radius;
        const y = cy + Math.sin(p.angle) * p.radius * 0.55;
        const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(t * 2 + p.phase));
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.hue},${twinkle})`;
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      const breathe = 1 + Math.sin(t * 1.6) * 0.03;

      // garment fill + animated "sewing" stroke reveal
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(breathe, breathe);
      buildGarmentPath();
      const fillGrad = ctx.createLinearGradient(0, -R, 0, R);
      fillGrad.addColorStop(0, "rgba(96,165,250,0.18)");
      fillGrad.addColorStop(1, "rgba(79,70,229,0.05)");
      ctx.fillStyle = fillGrad;
      ctx.fill();

      const dashLen = 480;
      ctx.setLineDash([dashLen * 0.55, dashLen * 1.2]);
      ctx.lineDashOffset = -((t * 60) % (dashLen * 1.6));
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(147,197,253,0.9)";
      ctx.stroke();
      ctx.restore();

      // fabric shimmer sweep, clipped to the garment silhouette
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(breathe, breathe);
      buildGarmentPath();
      ctx.clip();
      const period = 2.4;
      const phase = (t % period) / period;
      const sweepX = -R * 1.4 + phase * (R * 2.8);
      const shimmer = ctx.createLinearGradient(sweepX - 18, 0, sweepX + 18, 0);
      shimmer.addColorStop(0, "rgba(255,255,255,0)");
      shimmer.addColorStop(0.5, "rgba(255,255,255,0.35)");
      shimmer.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = shimmer;
      ctx.fillRect(-R, -R, R * 2, R * 2);
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Rotating status line
  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOOM_MESSAGES.length);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  // Easing "fake" progress bar — decelerates toward ~94% and holds there
  // until the real response swaps this view out, rather than promising a
  // finish time we can't actually guarantee.
  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => (p < 94 ? p + (94 - p) * 0.06 : p));
    }, 220);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="py-6 text-center">
      <canvas ref={canvasRef} className="mx-auto block" aria-hidden="true" />
      <h4
        className="text-xs sm:text-sm font-bold text-zinc-200 mt-1 mb-1 min-h-[1.25rem]"
        aria-live="polite"
      >
        {LOOM_MESSAGES[msgIndex]}
      </h4>
      <div className="w-full max-w-[220px] mx-auto h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-3">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-[10px] text-zinc-500 mt-2">
        این فرآیند معمولاً بین ۱۵ تا ۵۰ ثانیه طول می‌کشد
      </p>
    </div>
  );
}

export default function ProductPage() {
  const [selectedProduct, setSelectedProduct] = useState<ProductItem>(
    PRODUCTS[0],
  );
  const [remainingTries, setRemainingTries] = useState<number | null>(4);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // VTON Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultImg, setResultImg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cart Functions
  const addToCart = () => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === selectedProduct.id);
      if (existing) {
        return prev.map((item) =>
          item.id === selectedProduct.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: selectedProduct.id,
          title: selectedProduct.title,
          price: selectedProduct.price,
          image: selectedProduct.image,
          quantity: 1,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // Helper to convert File to compressed Base64 Data URL
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_DIM = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height && width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          const base64 = canvas.toDataURL("image/jpeg", 0.85);
          resolve(base64);
        };
        img.onerror = () => resolve(reader.result as string);
        img.src = reader.result as string;
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleUserPhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      try {
        const base64Data = await convertFileToBase64(file);
        setUserPhoto(file);
        setUserPhotoPreview(base64Data);
        setErrorMsg(null);
      } catch (err) {
        setErrorMsg("خطا در بارگذاری تصویر. لطفاً تصویر دیگری انتخاب کنید.");
      }
    }
  };

  const handleTryOnSubmit = async () => {
    if (!userPhotoPreview || !userPhotoPreview.startsWith("data:image/")) {
      setErrorMsg("لطفاً ابتدا تصویر خود را بارگذاری کنید.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_image_base64: userPhotoPreview,
          garment_url: selectedProduct.image,
          // Authoritative catalog inputs for buildVtonPrompt
          category: selectedProduct.category ?? null,
          fit: selectedProduct.fit ?? null,

          description:
            selectedProduct.promptDescription ??
            selectedProduct.description ??
            null,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setErrorMsg(data.message);
        setRemainingTries(0);
        return;
      }

      if (data.success) {
        setResultImg(data.result_image);
        if (typeof data.remaining_tries === "number") {
          setRemainingTries(data.remaining_tries);
        }
      } else {
        setErrorMsg(data.message || "خطایی رخ داد.");
      }
    } catch (err) {
      setErrorMsg("خطا در برقراری ارتباط با سرور هوش مصنوعی.");
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setUserPhoto(null);
    setUserPhotoPreview(null);
    setResultImg(null);
    setErrorMsg(null);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-10 selection:bg-blue-600 selection:text-white">
      {/* ----------------- NAVBAR ----------------- */}
      <header className="bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800/80 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-3.5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-base sm:text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
              بوتیک آنلاین مدرن
            </span>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-100 transition"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-scaleIn">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ----------------- MAIN PRODUCT VIEW ----------------- */}
      <main className="max-w-5xl mx-auto px-3 sm:px-4 mt-3 sm:mt-6">
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl md:rounded-3xl p-3.5 sm:p-5 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 shadow-xl">
          {/* Column 1: Image & Thumbnails */}
          <div>
            <div className="w-full aspect-[4/5] max-h-[340px] sm:max-h-[420px] md:max-h-none bg-zinc-900 rounded-xl md:rounded-2xl overflow-hidden mb-3 border border-zinc-800 relative group">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.title}
                className="w-full h-full object-cover transition duration-300"
              />
              <span className="absolute top-2.5 right-2.5 bg-red-500/90 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                {selectedProduct.discount} تخفیف
              </span>
              <span className="absolute bottom-2.5 right-2.5 bg-zinc-950/80 backdrop-blur-md text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-zinc-800">
                {selectedProduct.badge}
              </span>
            </div>

            {/* Thumbnails */}
            <p className="text-[11px] text-zinc-400 mb-1.5 font-medium flex items-center gap-1">
              <Tag className="w-3 h-3 text-blue-400" />
              مدل را انتخاب کنید:
            </p>
            <div className="grid grid-cols-4 gap-2">
              {PRODUCTS.map((p) => {
                const isActive = selectedProduct.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className={`relative rounded-lg overflow-hidden border aspect-[3/4] transition ${
                      isActive
                        ? "border-blue-500 ring-2 ring-blue-500/30 scale-[1.02]"
                        : "border-zinc-800 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                    {isActive && (
                      <CheckCircle2 className="absolute top-1 right-1 text-blue-400 bg-zinc-950 rounded-full w-3.5 h-3.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: Product Info & Actions */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-2">
                <span className="bg-zinc-800/60 px-2 py-0.5 rounded text-zinc-400">
                  {selectedProduct.category}
                </span>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span className="font-bold text-zinc-200">
                    {selectedProduct.rating}
                  </span>
                  <span className="text-zinc-500">
                    ({selectedProduct.reviewsCount})
                  </span>
                </div>
              </div>

              <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-zinc-100 mb-3 leading-snug">
                {selectedProduct.title}
              </h1>

              {/* Price Box */}
              <div className="bg-zinc-950/70 border border-zinc-800/80 p-3 sm:p-4 rounded-xl mb-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-500 line-through ml-1.5">
                    {selectedProduct.oldPrice}
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-blue-400">
                    {selectedProduct.priceFormatted}
                  </span>
                  <span className="text-[11px] text-zinc-400 mr-1">تومان</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  موجود در انبار
                </span>
              </div>

              {/* Description */}
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-4 bg-zinc-950/30 p-2.5 rounded-xl border border-zinc-800/50">
                {selectedProduct.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={addToCart}
                className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-bold py-3 rounded-xl shadow transition flex items-center justify-center gap-1.5 text-xs sm:text-sm active:scale-[0.99]"
              >
                <ShoppingBag className="w-4 h-4" />
                افزودن به سبد خرید
              </button>

              {/* VTON Button */}
              <button
                onClick={() => {
                  resetModal();
                  setIsModalOpen(true);
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-3 sm:py-3.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-1.5 transition text-xs sm:text-sm border border-blue-400/20 active:scale-[0.99]"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />✨
                پرو آنلاین روی بدن من (هوش مصنوعی)
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-1 mt-4 pt-3 border-t border-zinc-800/60 text-center text-[10px] text-zinc-500">
              <div className="flex flex-col items-center gap-1">
                <Truck className="w-4 h-4 text-blue-400" />
                <span>ارسال رایگان</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>ضمانت کیفیت</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RotateCcw className="w-4 h-4 text-blue-400" />
                <span>۷ روز تعویض</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ----------------- COMPACT SHOPPING CART DRAWER ----------------- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="bg-zinc-900 border-r border-zinc-800 w-full max-w-sm sm:max-w-md h-full flex flex-col justify-between p-4 sm:p-5 animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-sm sm:text-base">
                    سبد خرید شما ({totalItemsCount})
                  </h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 text-xs">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>سبد خرید شما خالی است.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80 items-center justify-between"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-12 h-14 object-cover rounded-lg border border-zinc-800"
                      />
                      <div className="flex-1">
                        <h4 className="text-[11px] font-bold text-zinc-200 line-clamp-1 mb-0.5">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-blue-400 font-extrabold mb-1.5">
                          {(item.price * item.quantity).toLocaleString("fa-IR")}{" "}
                          تومان
                        </p>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-xs"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-xs font-bold px-1">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-xs"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-3 border-t border-zinc-800">
                <div className="flex justify-between items-center mb-3 text-xs">
                  <span className="text-zinc-400">مبلغ کل:</span>
                  <span className="text-base font-black text-blue-400">
                    {totalPrice.toLocaleString("fa-IR")} تومان
                  </span>
                </div>
                <button
                  onClick={() => {
                    setOrderSuccess(true);
                    setCart([]);
                    setTimeout(() => {
                      setOrderSuccess(false);
                      setIsCartOpen(false);
                    }, 2000);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl shadow text-xs sm:text-sm transition"
                >
                  {orderSuccess
                    ? "سفارش شما با موفقیت ثبت شد ✓"
                    : "تکمیل فرآیند خرید و پرداخت"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- COMPACT MOBILE-FRIENDLY VTON MODAL ----------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-xs sm:text-sm text-zinc-100">
                  پرو هوشمند آنلاین با AI
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto">
              {remainingTries !== null && (
                <div className="mb-3 text-center">
                  <span className="text-[10px] sm:text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2.5 py-0.5 rounded-full font-medium">
                    فرصت مجاز پرو امروز شما: {remainingTries} عدد
                  </span>
                </div>
              )}

              {!resultImg && !loading && (
                <div>
                  <div className="flex items-center gap-2.5 mb-3 p-2 bg-zinc-950 rounded-xl border border-zinc-800/80">
                    <img
                      src={selectedProduct.image}
                      alt="Garment"
                      className="w-10 h-12 object-cover rounded-lg border border-zinc-800"
                    />
                    <div className="text-[11px]">
                      <p className="text-zinc-500 text-[10px]">لباس انتخابی:</p>
                      <p className="font-bold text-zinc-200 line-clamp-1">
                        {selectedProduct.title}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 mb-2">
                    عکس تمام‌قد خود را بارگذاری کنید:
                  </p>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-zinc-700 hover:border-blue-500 bg-zinc-950/50 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition h-36 sm:h-44 relative overflow-hidden"
                  >
                    {userPhotoPreview ? (
                      <img
                        src={userPhotoPreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-zinc-500 mb-1.5" />
                        <span className="text-xs font-semibold text-zinc-300">
                          لمس برای انتخاب عکس
                        </span>
                        <span className="text-[10px] text-zinc-500 mt-0.5">
                          فرمت JPG یا PNG
                        </span>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUserPhotoChange}
                  />

                  {errorMsg && (
                    <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] rounded-xl text-center">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    onClick={handleTryOnSubmit}
                    disabled={!userPhoto}
                    className="w-full mt-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-2.5 sm:py-3 rounded-xl transition text-xs sm:text-sm"
                  >
                    مشاهده تن‌خور روی بدن من
                  </button>
                </div>
              )}

              {loading && <TryOnLoadingCanvas />}

              {resultImg && (
                <div>
                  <div className="rounded-xl overflow-hidden border border-zinc-800 shadow mb-3 aspect-[3/4] max-h-[320px] bg-zinc-950 mx-auto">
                    <img
                      src={resultImg}
                      alt="Result"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={resultImg}
                      download="vton-result.png"
                      className="flex-1 bg-white hover:bg-zinc-200 text-zinc-950 text-center font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      دانلود عکس
                    </a>
                    <button
                      onClick={resetModal}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold px-3 py-2.5 rounded-xl text-xs transition"
                    >
                      تلاش مجدد
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
