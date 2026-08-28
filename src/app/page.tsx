"use client";

import { useState, useRef } from "react";
import {
  Sparkles,
  ShoppingBag,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  X,
  Upload,
  RefreshCw,
  Download,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Tag,
} from "lucide-react";

interface ProductItem {
  id: string;
  title: string;
  category: string;
  price: number;
  tags: string[];
  priceFormatted: string;
  oldPrice: string;
  discount: string;
  rating: number;
  reviewsCount: number;
  sku: string;
  image: string;
  description: string;
  badge: string;
}

const PRODUCTS: ProductItem[] = [
  {
    id: "outfit-1",
    title: "ست ۳ تکه کژوال پیراهن لنین یاسی، تی‌شرت پنبه و شلوار کتان شیری",
    category: "ست کامل ۳ تکه تابستانه",
    price: 5130000,
    priceFormatted: "۵,۱۳۰,۰۰۰",
    oldPrice: "۶,۳۸۰,۰۰۰",
    discount: "۲۰٪",
    rating: 4.9,
    reviewsCount: 68,
    sku: "SET-LILAC-01",
    image: "/garments/garment-1.jpg",
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
    category: "ست خیابانی / Streetwear",
    price: 4520000,
    priceFormatted: "۴,۵۲۰,۰۰۰",
    oldPrice: "۵,۶۶۰,۰۰۰",
    discount: "۱۵٪",
    rating: 4.8,
    reviewsCount: 44,
    sku: "STR-BLUE-02",
    image: "/garments/garment-2.jpg",
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
    category: "پیراهن اسمارت کژوال",
    price: 3380000,
    priceFormatted: "۳,۳۸۰,۰۰۰",
    oldPrice: "۴,۲۵۰,۰۰۰",
    discount: "۲۱٪",
    rating: 5.0,
    reviewsCount: 92,
    sku: "SHIRT-OXF-03",
    image: "/garments/garment-3.jpg",
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
    title: "ست مینیمال پیراهن نخی سبز پسته‌ای پاستلی و شلوار جین واید سفید",
    category: "ست مینیمال لوکس",
    price: 4860000,
    priceFormatted: "۴,۸۶۰,۰۰۰",
    oldPrice: "۶,۰۴۰,۰۰۰",
    discount: "۱۹٪",
    rating: 4.9,
    reviewsCount: 51,
    sku: "SET-LIME-04",
    image: "/garments/garment-3.png",
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
          garment_tags: selectedProduct.tags,
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

              {loading && (
                <div className="py-10 text-center">
                  <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-200 mb-1">
                    در حال هوشمندسازی و پرو لباس...
                  </h4>
                  <p className="text-[10px] text-zinc-500">
                    لطفاً ۱۰ الی ۲۵ ثانیه صبور باشید.
                  </p>
                </div>
              )}

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
