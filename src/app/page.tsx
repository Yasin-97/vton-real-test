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
    description:
      "ست کژوال بسیار شیک و خنک شامل پیراهن رویه لنین ارگانیک رنگ یاسی پاستلی، زیرپیراهنی پنبه‌ای سفید و شلوار کتان بنددار کرم شیری با تن‌خور آزاد و بسیار راحت.",
    badge: "پرفروش‌ترین ست فصل",
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
    description:
      "استایل ترند لش و خیابانی با تی‌شرت اورسایز ۲۸۰ گرم پنبه‌ای با چاپ گلدوزی مینیمال Rise Above به همراه شلوار جین بگ زغالی سنگ‌شور شده بدون تغییر رنگ.",
    badge: "ترند اینستاگرام",
  },
  {
    id: "outfit-3",
    title: "پیراهن کلاسیک آکسفورد تمام پنبه آبی آسمانی (طرح پولو)",
    category: "پیراهن مردانه اسمارت کژوال",
    price: 3380000,
    priceFormatted: "۳,۳۸۰,۰۰۰",
    oldPrice: "۴,۲۵۰,۰۰۰",
    discount: "۲۱٪",
    rating: 5.0,
    reviewsCount: 92,
    sku: "SHIRT-OXF-03",
    image: "/garments/garment-3.jpg",
    description:
      "پیراهن اداری و مجلسی خوش‌دوخت با پارچه ۱۰۰٪ آکسفورد ترک ضد چروک با لوگوی گلدوزی شده ظریف پولو. مناسب استایل‌های رسمی و نیمه‌رسمی.",
    badge: "گارانتی اصالت پارچه",
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
    description:
      "ترکیب چشم‌نواز پیراهن سبک پاستلی رنگ لیمویی-پسته‌ای با بافت لطیف نخی به همراه شلوار جین واید پاییزه سفید یخچالی با دوخت صنعتی دوبل.",
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

  // Helper to resize/compress image in browser
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressed = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressed);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            0.85,
          );
        };
      };
    });
  };

  // Helper to convert File to valid compressed Base64 Data URL
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

          // Guaranteed valid Base64 Data URL (data:image/jpeg;base64,...)
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
        setUserPhotoPreview(base64Data); // Real base64 string
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          person_image_base64: userPhotoPreview,
          garment_url: selectedProduct.image,
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16 selection:bg-blue-600 selection:text-white">
      {/* ----------------- NAVBAR ----------------- */}
      <header className="bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
              بوتیک اختصاصی مدرن
            </span>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 transition"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-scaleIn">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ----------------- MAIN PRODUCT VIEW ----------------- */}
      <main className="max-w-6xl mx-auto px-4 mt-8">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-10 shadow-2xl">
          {/* Right Column: Active Image & 4 Interactive Garments */}
          <div>
            <div className="aspect-[3/4] bg-zinc-900 rounded-2xl overflow-hidden mb-4 border border-zinc-800 relative group">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.title}
                className="w-full h-full object-cover transition duration-500"
              />
              <span className="absolute top-4 right-4 bg-red-500/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-lg">
                {selectedProduct.discount} تخفیف ویژه
              </span>
              <span className="absolute bottom-4 right-4 bg-zinc-950/80 backdrop-blur-md text-blue-400 text-xs font-semibold px-3 py-1 rounded-lg border border-zinc-800">
                {selectedProduct.badge}
              </span>
            </div>

            {/* 4 Interactive Garment Switchers */}
            <p className="text-xs text-zinc-400 mb-2 font-bold flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              برای انتخاب و پرو لباس، روی هر مدل کلیک کنید:
            </p>
            <div className="grid grid-cols-4 gap-3">
              {PRODUCTS.map((p) => {
                const isActive = selectedProduct.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className={`relative rounded-xl overflow-hidden border-2 aspect-[3/4] transition duration-200 ${
                      isActive
                        ? "border-blue-500 ring-4 ring-blue-500/30 scale-[1.03]"
                        : "border-zinc-800 opacity-60 hover:opacity-100 hover:border-zinc-700"
                    }`}
                  >
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                    {isActive && (
                      <CheckCircle2 className="absolute top-1.5 right-1.5 text-blue-400 bg-zinc-950 rounded-full w-4 h-4" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Left Column: Dynamic Product Info */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
                <span className="bg-zinc-800/60 px-2.5 py-1 rounded-md text-zinc-400">
                  {selectedProduct.category}
                </span>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="font-bold text-zinc-200">
                    {selectedProduct.rating}
                  </span>
                  <span className="text-zinc-500">
                    ({selectedProduct.reviewsCount} نظر خریداران)
                  </span>
                </div>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-100 mb-5 leading-relaxed">
                {selectedProduct.title}
              </h1>

              {/* Dynamic Price Box */}
              <div className="bg-zinc-950/70 border border-zinc-800/80 p-5 rounded-2xl mb-6 flex items-center justify-between">
                <div>
                  <span className="text-sm text-zinc-500 line-through ml-2">
                    {selectedProduct.oldPrice}
                  </span>
                  <span className="text-3xl font-black text-blue-400">
                    {selectedProduct.priceFormatted}
                  </span>
                  <span className="text-xs text-zinc-400 mr-1.5">تومان</span>
                </div>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  موجود در انبار بوتیک
                </span>
              </div>

              {/* Description */}
              <p className="text-zinc-300 text-sm leading-relaxed mb-8 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/60">
                {selectedProduct.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3.5">
              <button
                onClick={addToCart}
                className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-extrabold py-4 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <ShoppingBag className="w-5 h-5" />
                افزودن این ست به سبد خرید
              </button>

              {/* ✨ AI Virtual Try-On Button ✨ */}
              <button
                onClick={() => {
                  resetModal();
                  setIsModalOpen(true);
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition active:scale-[0.99] border border-blue-400/20"
              >
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />✨
                پرو آنلاین این لباس روی تن من (AI)
              </button>
            </div>

            {/* Badges */}
            <div className="grid grid-cols-3 gap-2 mt-8 pt-6 border-t border-zinc-800/80 text-center text-xs text-zinc-400">
              <div className="flex flex-col items-center gap-1.5">
                <Truck className="w-5 h-5 text-blue-400" />
                <span>ارسال رایگان سراسری</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <span>ضمانت کیفیت پارچه</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <RotateCcw className="w-5 h-5 text-blue-400" />
                <span>۷ روز ضمانت تعویض</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ----------------- SHOPPING CART DRAWER ----------------- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="bg-zinc-900 border-r border-zinc-800 w-full max-w-md h-full flex flex-col justify-between p-6 animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-lg">
                    سبد خرید شما ({totalItemsCount})
                  </h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-16 text-zinc-500">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>سبد خرید شما خالی است.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 bg-zinc-950/50 p-3.5 rounded-2xl border border-zinc-800/80 items-center justify-between"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-16 h-20 object-cover rounded-xl border border-zinc-800"
                      />
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-zinc-200 line-clamp-1 mb-1">
                          {item.title}
                        </h4>
                        <p className="text-xs text-blue-400 font-extrabold mb-2">
                          {(item.price * item.quantity).toLocaleString("fa-IR")}{" "}
                          تومان
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 rounded-md bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold px-1">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 rounded-md bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t border-zinc-800">
                <div className="flex justify-between items-center mb-4 text-sm">
                  <span className="text-zinc-400">مبلغ قابل پرداخت:</span>
                  <span className="text-xl font-black text-blue-400">
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
                    }, 2500);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3.5 rounded-xl shadow-lg transition"
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

      {/* ----------------- DARK VTON MODAL ----------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-zinc-100">
                  پرو هوشمند آنلاین با AI
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {" "}
              {remainingTries !== null && (
                <div className="mb-4 text-center">
                  <span className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-medium">
                    تعداد پرو مجاز باقی‌مانده امروز شما: {remainingTries} عدد
                  </span>
                </div>
              )}
              {!resultImg && !loading && (
                <div>
                  <div className="flex items-center gap-3 mb-5 p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                    <img
                      src={selectedProduct.image}
                      alt="Garment"
                      className="w-14 h-16 object-cover rounded-xl border border-zinc-800"
                    />
                    <div className="text-xs">
                      <p className="text-zinc-500 mb-0.5">
                        لباس انتخابی برای پرو:
                      </p>
                      <p className="font-bold text-zinc-200 line-clamp-1">
                        {selectedProduct.title}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 mb-3">
                    یک عکس تمام‌قد از خودتان بارگذاری کنید تا تن‌خور این لباس را
                    روی بدن خود ببینید:
                  </p>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-700 hover:border-blue-500 bg-zinc-950/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition h-52 relative overflow-hidden"
                  >
                    {userPhotoPreview ? (
                      <img
                        src={userPhotoPreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                        <span className="text-xs font-semibold text-zinc-300">
                          برای انتخاب عکس خود کلیک کنید
                        </span>
                        <span className="text-[11px] text-zinc-600 mt-1">
                          فرمت‌های JPG یا PNG (تمام قد)
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
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    onClick={handleTryOnSubmit}
                    disabled={!userPhoto}
                    className="w-full mt-5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-extrabold py-3.5 rounded-2xl transition"
                  >
                    مشاهده تن‌خور روی بدن من
                  </button>
                </div>
              )}
              {loading && (
                <div className="py-14 text-center">
                  <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
                  <h4 className="text-base font-bold text-zinc-200 mb-1">
                    در حال هوشمندسازی و پرو لباس...
                  </h4>
                  <p className="text-xs text-zinc-500">
                    لطفاً ۱۰ الی ۲۵ ثانیه صبور باشید.
                  </p>
                </div>
              )}
              {resultImg && (
                <div>
                  <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-lg mb-5 aspect-[3/4] bg-zinc-950">
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
                      className="flex-1 bg-white hover:bg-zinc-200 text-zinc-950 text-center font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition"
                    >
                      <Download className="w-4 h-4" />
                      دانلود عکس نهایی
                    </a>
                    <button
                      onClick={resetModal}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold px-4 py-3 rounded-xl text-xs transition"
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
