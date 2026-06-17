import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory catalog of products sourced from Farsi mock dataset matching the client
const mockProducts = [
  {
    id: 'p1',
    title: 'گوشی موبایل سامسونگ گلکسی S24 Ultra دو سیم‌کارت ظرفیت 256 گیگابایت',
    englishTitle: 'Samsung Galaxy S24 Ultra 5G Dual SIM 256GB',
    price: 68900000,
    originalPrice: 72500000,
    category: 'گوشی موبایل',
    categoryId: 'phones',
    rating: 4.8,
    reviewsCount: 124,
    vendor: { name: 'یوزآنلاین دیجیتال', rating: 4.9, logo: 'AD' },
    description: 'پرچمدار جدید سامسونگ مجهز به هوش مصنوعی پیشرفته Galaxy AI، دوربین فوق‌العاده ۲۰۰ مگاپیکسلی، نمایشگر روشن با روکش شیشه‌ای مقاوم گوریلا آرمور و بدنه تیتانیومی بی‌نظیر. قلم S-Pen اختصاصی کارایی را دوچندان می‌کند.',
    specifications: {
      'ابعاد صفحه فایل': '۶.۸ اینچ Dynamic AMOLED 2X',
      'رزولوشن دوربین': '۲۰۰ + ۵۰ + ۱۲ + ۱۰ مگاپیکسل',
      'حافظه رم اولیه': '۱۲ گیگابایت',
      'باتری و شارژ': '۵۰۰۰ میلی‌آمپر ساعت - ۴۵ وات',
      'جنس بدنه': 'تیتانیوم درجه یک'
    }
  },
  {
    id: 'p2',
    title: 'هدفون بی‌سیم اپل مدل Airpods Pro 2 (USB-C) نویزکنسلینگ',
    englishTitle: 'Apple AirPods Pro 2nd Gen USB-C ANC',
    price: 13200000,
    originalPrice: 14500000,
    category: 'هدفون و تجهیزات صوتی',
    categoryId: 'audio',
    rating: 4.9,
    reviewsCount: 89,
    vendor: { name: 'پردیس کالا', rating: 4.7, logo: 'PK' },
    description: 'نسل دوم هدفون جادویی ایرپادز پرو با درگاه تایپ‌سی، تراشه جدید H2 برای تفکیک صدای پیشرفته، تا دو برابر لغو نویز فعال (ANC) بهتر، حالت شفافیت تطبیقی، و کیس شارژ مجهز به بلندگو همراه با حلقه بندآویز.',
    specifications: {
      'تراشه پردازش صوتی': 'H2 در هدفون‌ها / U1 در کیس',
      'عمر باتری کل': 'تا ۳۰ ساعت همراه باساز کیس شارژ',
      'نوع مقاومت محیطی': 'IP54 مقاوم در برابر گرد و غبار'
    }
  },
  {
    id: 'p3',
    title: 'ساعت هوشمند شیائومی مدل Redmi Watch 4 صفحه مستطیلی',
    englishTitle: 'Xiaomi Redmi Watch 4 Smart Watch',
    price: 4350000,
    originalPrice: 4800000,
    category: 'لوازم جانبی دیجیتال',
    categoryId: 'accessories',
    rating: 4.5,
    reviewsCount: 215,
    vendor: { name: 'هوشمند شاپ', rating: 4.6, logo: 'HS' },
    description: 'ساعت هوشمند ردمی واچ ۴ مجهز به فریم آلومینیومی مستحکم، نمایشگر امولد بزرگ و شارپ، GPS چندسیستمی مجزا برای ردیابی دقیق‌تر مسافت، تست ۲۴ ساعته اکسیژن و ضربان فلب.',
    specifications: {
      'اندازه صفحه': '۱.۹۷ اینچ AMOLED',
      'ظرفیت باتری': '۴۷۰ میلی‌آمپر (تا ۲۰ روز)',
      'سنسورهای سلامت': 'سنسور ضربان، اکسیژن خون'
    }
  },
  {
    id: 'p4',
    title: 'کفش رانینگ مردانه نایک پگاسوس Air Zoom Pegasus 40',
    englishTitle: 'Nike Air Zoom Pegasus 40 Running Shoes',
    price: 6400000,
    category: 'کفش و کتانی',
    categoryId: 'shoes',
    rating: 4.7,
    reviewsCount: 63,
    vendor: { name: 'ورزش‌سرا', rating: 4.8, logo: 'VS' },
    description: 'کفش دویدن نمادین نایک پگاسوس ۴۰ مجهز به فناوری ضربه‌گیر رفلکسیک زوم‌ایر برای بازگشت انرژی فوق‌العاده. رویه توری تنفس‌پذیر مهندسی‌شده مناسب برای ماراتن و کارهای طولانی‌مدت روزمره.',
    specifications: {
      'نوع زیره': 'لاستیک ضدسایش با چسبندگی بالا',
      'فناوری لایه میانی': 'Nike React Foam + 2 Zoom Air units',
      'جنس رویه': 'پارچه بافته مشبک تک‌لایه'
    }
  },
  {
    id: 'p5',
    title: 'قهوه‌ساز نوا مدل Nova 149 espresso maker صنعتی',
    englishTitle: 'Nova 149 Espresso Maker Espresso Coffee',
    price: 7800000,
    originalPrice: 8500000,
    category: 'لوازم آشپزخانه',
    categoryId: 'kitchen',
    rating: 4.6,
    reviewsCount: 42,
    vendor: { name: 'کاج لند', rating: 4.5, logo: 'CL' },
    description: 'دستگاه اسپرسوساز قوی و نیمه‌صنعتی برند معتبر نوا ۱۴۹ با فشار بخار ۱۵ بار واقعی و توان مصرفی ۱۲۵۰ وات. مناسب برای کافه‌های کوچک و کارهای خانگی، مجهز به نازل تولید کف شیر کرم‌دار.',
    specifications: {
      'فشار بخار پمپ': '۱۵ بار اول آلمان',
      'توان مصرفی موتور': '۱۲۵۰ وات اسمی',
      'حجم مخزن آب': '۱.۵ لیتر شفاف'
    }
  },
  {
    id: 'p6',
    title: 'کوله‌پشتی کوهنوردی دیوتر مدل Act Trail Pro 40L ضدآب',
    englishTitle: 'Deuter Act Trail Pro 40 Liters Backpack',
    price: 5200000,
    category: 'کیف و کوله‌پشتی',
    categoryId: 'bags',
    rating: 4.8,
    reviewsCount: 16,
    vendor: { name: 'ورزش‌سرا', rating: 4.8, logo: 'VS' },
    description: 'کوله‌پشتی فنی ۴۰ لیتری دیوتر آلمان مناسب برای برنامه‌های دو تا سه روزه بک‌پکینگ و کمپینگ. پشتی توری Aircontact ضدتعریق، محفظه کیسه خواب مجزا، سگک ارگونومیک لگن و کاور باران جاساز.',
    specifications: {
      'ظرفیت حجم داخلی': '۴۰ لیتر واقعی باری',
      'جنس بدنه خارجی': 'نایلون ۱۰۰ بعدی مایکرو ریپ‌استاپ',
      'وزن سیستم خالی': '۱۳۵۰ گرم خالص'
    }
  }
];

// Lazy-initialize Gemini API Node SDK to prevent startup crashes if key is missing
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      console.log('Gemini AI Client initialized successfully using server-side key.');
    } catch (e) {
      console.error('Error initializing Gemini Client:', e);
    }
  }
  return aiClient;
}

// 1. AI Chat Endpoint: Shopping Assistant
app.post('/api/ai/chat', async (req, res) => {
  const { message, history = [], context = {} } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'پیام کاربر نباید خالی باشد.' });
  }

  const client = getAiClient();

  if (client) {
    try {
      // Build catalog context for system prompt
      const catalogSummary = mockProducts.map(p => 
        `- شناسه: ${p.id}, کالا: ${p.title} (${p.englishTitle}), قیمت: ${p.price} تومان، دسته: ${p.category}, امتیاز: ${p.rating}, فروشنده: ${p.vendor.name}`
      ).join('\n');

      const systemPrompt = `
      شما "پشتیبان هوشمند و الیار خرید یوزآنلاین" هستید - یک دستیار فوق‌العاده باهوش، محترم، خنده‌رو و خوش‌برخورد برای راهنمایی کاربران در بازارچه آنلاین یوزآنلاین (UseOnline Shop).
      شما با ساختار و کاتالوگ دقیق فروشگاه آشنا هستید. همواره رفتار صمیمی و در عین حال کاملا حرفه‌ای و به زبان فارسی داشته باشید.
      
      کاتالوگ محصولات کنونی فروشگاه یوزآنلاین:
      ${catalogSummary}

      قوانین راهنمایی:
      - حتماً بر اساس بودجه کاربر کالاها را فیلتر یا معرفی کنید (مثال: گوشی S24 Ultra حدود ۶۸ میلیون تومانه، ایرپادز پگاسوس ۱۳.۲ میلیون، ردمی واچ ۴.۳ میلیون، پگاسوس ۶.۴ میلیون، قهوه‌ساز ۷.۸ میلیون، کوله‌پشتی دیوتر ۵.۲ میلیون).
      - اگر کاربر خواست محصولات را مقایسه کند (مانند مقایسه ساعت ردمی واچ با ساعت‌های دیگر یا بررسی تفاوت‌ها)، مشخصات فنی آن‌ها را مرتب در جدول یا لیست بولت‌پوینت بنویسید.
      - پیشنهاد خرید مکمل (Cross-sell) یا فروش پیشرفته (Up-sell) بدهید (مثلاً برای خرید گوشی سامسونگ، خرید ایرپاد یا لوازم جانبی پیشنهاد بدید).
      - لحن گفتگو صمیمی و دوستانه با لحن صوتی ایرانی باشد. از اصطلاحات شیرین پارسی استفاده کنید.
      `;

      // Structure conversational chats for @google/genai SDK
      const contents = history.map((chat: any) => ({
        role: chat.role === 'user' ? 'user' : 'model',
        parts: [{ text: chat.text }]
      }));

      // Add the final user query
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        }
      });

      return res.json({
        response: response.text || 'من در خدمت شما هستم، متاسفانه پاسخ صریحی دریافت نشد.',
        isSimulated: false
      });
    } catch (err: any) {
      console.error('Gemini API execution error, falling back to intelligent simulation:', err.message);
    }
  }

  // fallback dynamic mock assistant with intelligent matching
  const responseText = simulateChatResponse(message, history, context);
  return res.json({
    response: responseText,
    isSimulated: true
  });
});

// Helper for typo-tolerant string distance
function levenshteinDistance(s1: string, s2: string): number {
  const lens1 = s1.length, lens2 = s2.length;
  const matrix = Array.from({ length: lens1 + 1 }, () => Array(lens2 + 1).fill(0));

  for (let i = 0; i <= lens1; i++) matrix[i][0] = i;
  for (let j = 0; j <= lens2; j++) matrix[0][j] = j;

  for (let i = 1; i <= lens1; i++) {
    for (let j = 1; j <= lens2; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,    // deletion
          matrix[i][j - 1] + 1,    // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }
  return matrix[lens1][lens2];
}

// 2. AI Semantic Search Endpoint
app.post('/api/ai/search', async (req, res) => {
  const { query } = req.body;
  if (!query || query.trim() === '') {
    return res.json({ results: [], suggestions: [] });
  }

  const cleanQuery = query.toLowerCase().trim();
  const client = getAiClient();

  if (client) {
    try {
      const productTokens = mockProducts.map(p => ({
        id: p.id,
        title: p.title,
        english: p.englishTitle,
        category: p.category,
        keywords: p.description
      }));

      const systemPrompt = `
      شما مغز متفکر بخش "جستجوی معنایی فارسی یوزآنلاین" هستید.
      وظیفه شما ترجمه پیام طبیعی کاربر به لیست شیء دارای خروجی JSON است.
      کاتالوگ محصولات ما:
      ${JSON.stringify(productTokens, null, 2)}

      کاربر ممکن است دچار اشتباه تایپی باشد (مثلا "سامسونگ اس۲۴" به جای "سامسونگ گلکسی S24 Ultra"، "هدفن" یا "ایرباد" به جای "هدفون بی‌سیم اپل"، "کیف کوه" به جای "کوله‌پشتی کوهنوردی").
      شما باید با تحمل اشتباه تایپی، غنای معنایی و تشخیص دسته همخوان، یک آبجکت JSON معتبر به فرمت زیر برگردانید:
      {
        "matches": [
          { "productId": "شناسه محصول", "relevance": 0.0 تا 1.0, "reason": "دلیل همخوانی معنایی به فارسی کوتاه" }
        ],
        "suggestions": ["سه عبارت پیشنهادی مرتبط با کلیدواژه شما در فروشگاه"]
      }
      فقط کدهای خام JSON یا ساختار آن را پاسخ دهید و از توضیحات مارک داون اضافی کلا پرهیز کنید.
      `;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `عبارت جستجوی کاربر: "${cleanQuery}"`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.1,
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        results: parsed.matches || [],
        suggestions: parsed.suggestions || [],
        isSimulated: false
      });
    } catch (err: any) {
      console.error('Gemini Search error, falling back to local semantic parser:', err.message);
    }
  }

  // Local Typo-Tolerant & Semantic Search Engine Fallback
  const results: any[] = [];
  const suggestions: string[] = [];

  // Match keyword patterns
  mockProducts.forEach(p => {
    let relevance = 0;
    let reason = '';

    const titleLower = p.title.toLowerCase();
    const titleEngLower = p.englishTitle.toLowerCase();
    const descLower = p.description.toLowerCase();

    // Exact word matching
    if (titleLower.includes(cleanQuery) || titleEngLower.includes(cleanQuery)) {
      relevance = 0.95;
      reason = 'همخوانی مستقیم با عنوان کالا';
    } else if (descLower.includes(cleanQuery)) {
      relevance = 0.75;
      reason = 'یافت‌شده در توضیحات و جزئیات فنی کالا';
    } else {
      // Check for typo tolerance using levenshtein or substrings
      const queryWords = cleanQuery.split(/\s+/);
      let matchCount = 0;
      queryWords.forEach(qw => {
        if (qw.length > 2) {
          if (titleLower.includes(qw) || descLower.includes(qw)) {
            matchCount++;
          } else {
            // Check word distance
            const titleWords = titleLower.split(/[\s,()\-]+/);
            titleWords.forEach(tw => {
              if (tw.length > 2 && levenshteinDistance(qw, tw) <= 1) {
                matchCount += 0.8;
              }
            });
          }
        }
      });

      if (matchCount > 0) {
        relevance = Math.min(0.3 + (matchCount * 0.2), 0.7);
        reason = 'همخوانی معنایی با تحمل اشتباهات نگارشی';
      }
    }

    if (relevance > 0) {
      results.push({
        productId: p.id,
        relevance,
        reason
      });
    }
  });

  // Sort by relevance
  results.sort((a, b) => b.relevance - a.relevance);

  // Generate intelligent search suggestions
  if (cleanQuery.includes('موبایل') || cleanQuery.includes('گوشی') || cleanQuery.includes('سام')) {
    suggestions.push('قیمت گوشی S24 Ultra', 'بهترین پرچمدار سامسونگ', 'شارژر اورجینال سامسونگ');
  } else if (cleanQuery.includes('آهنگ') || cleanQuery.includes('صد') || cleanQuery.includes('هدفون') || cleanQuery.includes('بادز')) {
    suggestions.push('ایرپاد پرو ۲ نویزکنسلینگ', 'هدفون دورسیور اورجینال', 'کیف کیس شارژر');
  } else {
    suggestions.push('اسپرسوساز نوا ۱۴۹', 'کفش پیاده روی پگاسوس ۴۰', 'کوله‌پشتی کوهنوردی دیوتر');
  }

  return res.json({
    results,
    suggestions,
    isSimulated: true
  });
});

// 3. AI Predictive Forecasting Analytics Endpoint for Vendor & Admin
app.get('/api/ai/forecasting', (req, res) => {
  // Generate structured high-fidelity forecasting vectors (30-day projection)
  const days = Array.from({ length: 30 }, (_, i) => `روز ${i + 1}`);
  
  // Category-wise baseline demand coefficients
  const demandProjections = {
    digital: days.map((_, i) => Math.round(120 + Math.sin(i / 2) * 20 + Math.random() * 8)),
    apparel: days.map((_, i) => Math.round(80 + Math.cos(i / 3) * 15 + Math.random() * 5)),
    home: days.map((_, i) => Math.round(60 + Math.sin(i / 4) * 10 + Math.random() * 4)),
  };

  // Vendor Inventory level forecasts + low stock prediction calendar
  const inventoryForecasts = mockProducts.map(p => {
    const currentStock = p.id === 'p1' ? 8 : p.id === 'p2' ? 3 : p.id === 'p3' ? 14 : p.id === 'p4' ? 1 : p.id === 'p5' ? 5 : 12;
    const dailyDemandRate = p.id === 'p1' ? 0.8 : p.id === 'p2' ? 1.2 : p.id === 'p3' ? 1.5 : p.id === 'p4' ? 0.6 : p.id === 'p5' ? 0.4 : 0.5;
    const simulatedDaysToExhaustion = Math.round(currentStock / dailyDemandRate);
    
    // Suggest pricing optimization recommendations
    let pricingTip = 'حفظ قیمت کنونی';
    let pricingDelta = 0;
    if (simulatedDaysToExhaustion < 5) {
      pricingTip = 'افزایش ۳+ درصد جهت مدیریت تقاضا و تامین شارژ مجدد';
      pricingDelta = 3;
    } else if (simulatedDaysToExhaustion > 20) {
      pricingTip = 'کاهش ۵- درصد همراه با کمپین تخفیفی جهت تخلیه انبار راکد';
      pricingDelta = -5;
    } else {
      pricingTip = 'قیمت بهینه با حاشیه سود پایدار همخوان است';
    }

    return {
      productId: p.id,
      title: p.title,
      vendorName: p.vendor.name,
      currentStock,
      dailyDemandRate: parseFloat(dailyDemandRate.toFixed(1)),
      daysToExhaustion: simulatedDaysToExhaustion,
      lowStockAlarm: simulatedDaysToExhaustion <= 4,
      pricingStrategy: pricingTip,
      pricingDelta
    };
  });

  // Admin Level Market Anomalies (Fraud logs)
  const fraudDetections = [
    { id: 'f1', userId: 'usr-9284', score: 94, reason: 'کلیک‌های متداوم و غیرارادی ربات از آی‌پی مسدودشده', action: 'مسدودسازی موقت نشست', timestamp: '۱۰ دقیقه قبل' },
    { id: 'f2', userId: 'usr-3891', score: 81, reason: 'تعدد درخواست در تست درگاه‌های اعتباری Tara و ZarinPal', action: 'نیاز به احراز OTP مجدد', timestamp: '۱ ساعت قبل' },
    { id: 'f3', userId: 'usr-1102', score: 45, reason: 'ثبت ۱۰ نشانی متفاوت در کمتر از ۳ دقیقه', action: 'بررسی ناظر کارشناس', timestamp: '۳ ساعت قبل' }
  ];

  return res.json({
    demandProjections,
    inventoryForecasts,
    fraudDetections,
    revenueForecast: days.map((_, i) => Math.round(420000000 + i * 15000000 + Math.sin(i / 1.5) * 25000000))
  });
});

// 4. AI Cross-sell & Up-sell Engine
app.get('/api/ai/recommendations', (req, res) => {
  const { productId, purchaseHistoryIds = [] } = req.query;

  // Build high-fidelity product-specific Cross-sell & Up-sell associations
  let selectedId = typeof productId === 'string' ? productId : 'p1';
  let matchesSimilar: string[] = [];
  let matchesCrossSell: string[] = [];
  let matchesUpSell: string[] = [];

  if (selectedId === 'p1') {
    // S24 Ultra
    matchesSimilar = ['p3']; // Redmi Watch 4
    matchesCrossSell = ['p2', 'p3']; // Airpods, Red Watch
    matchesUpSell = ['p1']; // already high end
  } else if (selectedId === 'p2') {
    // Airpods
    matchesSimilar = ['p3'];
    matchesCrossSell = ['p1']; // Galaxy S24
    matchesUpSell = ['p2'];
  } else {
    matchesSimilar = ['p1', 'p2'];
    matchesCrossSell = ['p6', 'p4'];
    matchesUpSell = ['p1', 'p2'];
  }

  return res.json({
    similar: mockProducts.filter(p => matchesSimilar.includes(p.id)),
    crossSell: mockProducts.filter(p => matchesCrossSell.includes(p.id)),
    upSell: mockProducts.filter(p => matchesUpSell.includes(p.id)),
    personalized: mockProducts.slice(0, 3) // personalized baseline
  });
});

// Helper for simulated conversational response
function simulateChatResponse(message: string, history: any[], context: any): string {
  const m = message.toLowerCase();
  
  if (m.includes('سلام') || m.includes('درود') || m.includes('hi') || m.includes('hello')) {
    return `**سلام کارفرمای گرامی!** من دستیار خرید هوشمند بازارچه یوزآنلاین (UseOnline Copilot) هستم. 🌸\n\nامروز تمایل داری چه کالایی رو با هم مقایسه، جستجو یا تحلیل کنیم؟ من اطلاعات کامل درباره محصولات از جمله گوشی S24 Ultra، ایرپادز پرو، نوا اسبرسوساز و بقیه موارد رو با جزئیات فنی دارم.`;
  }
  
  if (m.includes('گوشی') || m.includes('سامسونگ') || m.includes('s24')) {
    return `**سامسونگ گلکسی S24 Ultra** یکی از بهترین پرچمدارهای حال حاضر بازار در یوزآنلاینه! \n\n**مشخصات کلیدی:**\n- 📸 دوربین بی‌نظیر ۲۰۰ مگاپیکسلی با هوش مصنوعی\n- ⚡ پردازنده پرقدرت اسنپدراگون ۸ نسل ۳\n- 💰 قیمت: **۶۸,۹۰۰,۰۰۰ تومان** (شامل ۵٪ تخفیف ویژه!)\n- 🚚 ارسال سریع و رایگان در سراسر ایران\n\n*پیشنهاد مکمل:* این غول فناوری رو برات با هدفون نویزکنسلینگ **ایرپادز پرو ۲** ست کنم تا ترکیب صوتی و تماشای فیلم محشری داشته باشی؟ هماهنگه؟`;
  }

  if (m.includes('هدفون') || m.includes('ایرپاد') || m.includes('صدا')) {
    return `دست گذاشتی روی یکی از باکیفیت‌ترین کالاهای صوتی ما! 🎧 **اپل Airpods Pro نسل ۲ با درگاه تایپ‌سی**.\n\nقیمتش **۱۳,۲۰۰,۰۰۰ تومان** هستش و نویزکنسلینگ فوق‌العاده‌اش شلوغی‌های خیابون یا دفتر کار رو کاملاً حذف می‌کنه.\n\nمایلی برات در سبد خرید رزرو کنم یا می‌خوای با ساعت ردمی واچ ۴ ستش کنی؟`;
  }

  if (m.includes('بودجه') || m.includes('ارزان') || m.includes('قیمت')) {
    return `به نکته خوبی اشاره کردی! فیلترینگ بودجه‌ای هوشمند یوزآنلاین به این صورته:\n\n1. **زیر ۵ میلیون تومان:**\n   - ساعت هوشمند Redmi Watch 4 با قیمت **۴,۳۵۰,۰۰۰ تومان** ⌚\n\n2. **۵ تا ۱۰ میلیون تومان:**\n   - کوله‌پشتی اورجینال Deuter 40L با قیمت **۵,۲۰۰,۰۰۰ تومان** 🎒\n   - کتانی ورزشی نایک پگاسوس با قیمت **۶,۴۰۰,۰۰۰ تومان** 👟\n   - قهوه‌ساز اسپرسو نوا با قیمت **۷,۸۰۰,۰۰۰ تومان** ☕\n\n3. **بالای ۱۰ میلیون تومان:**\n   - ایرپادز پرو اپل با قیمت **۱۳,۲۰۰,۰۰۰ تومان** 🎧\n   - پرچمدار گلکسی S24 یوزآنلاین با قیمت **۶۸,۹۰۰,۰۰۰ تومان** 📱\n\nکدام کالا با سطح نیاز و برنامه خرید شما همخوانی بیشتری دارد؟`;
  }

  if (m.includes('مقایسه') || m.includes('تفاوت') || m.includes('ساعت') || m.includes('کفش')) {
    return `بیایید یک مقایسه اجمالی و فنی بین کالاهای مکمل پرفروش انجام دهیم:\n\n| پارامتر فنی | ساعت ردمی واچ ۴ | کتانی نایک پگاسوس ۴۰ | اسپرسوساز نوا ۱۴۹ |\n| :--- | :--- | :--- | :--- |\n| **قیمت** | ۴,۳۵۰,۰۰۰ تومان | ۶,۴۰۰,۰۰۰ تومان | ۷,۸۰۰,۰۰۰ تومان |\n| **فروشنده** | هوشمند شاپ | ورزش‌سرا | کاج لند |\n| **امتیاز مشتریان** | ۴.۵ از ۵ | ۴.۷ از ۵ | ۴.۶ از ۵ |\n| **ویژگی کلیدی** | شارژدهی ۲۰ روزه و سنسور اکسیژن | فوم ری‌اکت و تیوپ گازی زوم‌ایر | پمپ قوی بخار ۱۵ بار با توان ۱۲۵۰ وات |\n\nهر سه این کالاها جزو برگزیده‌های رضایت مشتریان یوزآنلاین بوده و دارای ضمانت اصالت فیزیکی هستند! کدام یک فصد نهایی شدن دارد؟`;
  }

  return `به عنوان **یار هوشمند خرید یوزآنلاین**، متوجه موضوع شما شدم! من به صورت تخصصی آماده پاسخگویی درباره موجودی غرفه‌داران، کدهای تخفیف، سیستم پیش‌بینی موجودی انبارها و مقایسه هوشمند محصولات هستم.\n\nآیا دوست داری بیشتر درباره موجودی **سامسونگ گلکسی S24 Ultra** یا کفش‌های رانینگ **نایک پگاسوس ۴۰** با هم گپ بزنیم؟`;
}

// Vite Server initialization block
async function startServer() {
  // Vite middleware setup for Development Environment
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite development middleware integrated successfully.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static client files serving mapped from dist/.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UseOnline Full-Stack Server boot success. Listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
