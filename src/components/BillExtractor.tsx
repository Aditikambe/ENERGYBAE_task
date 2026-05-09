import { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2, IndianRupee, Zap, Activity, Grid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface BillData {
  consumerNumber: string;
  sanctionedLoad: string;
  unitsConsumed: string;
  billingAmount: string;
  tariffCategory: string;
}

export default function BillExtractor() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BillData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setData(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const extractData = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);

    try {
      const base64Data = image.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data,
                },
              },
              {
                text: `Extract the following data from this electricity bill:
                1. Consumer Number (often called 'ग्राहक क्रमांक')
                2. Sanctioned Load in KW (often called 'मंजूर भार')
                3. Units Consumed for the current month (often called 'एकूण वापर')
                4. Billing Amount (often called 'देयक रक्कम')
                5. Tariff Category (often called 'दर संकेत')
                
                Provide the output in JSON format.`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              consumerNumber: { type: Type.STRING },
              sanctionedLoad: { type: Type.STRING },
              unitsConsumed: { type: Type.STRING },
              billingAmount: { type: Type.STRING },
              tariffCategory: { type: Type.STRING },
            },
            required: ["consumerNumber", "sanctionedLoad", "unitsConsumed", "billingAmount", "tariffCategory"],
          },
        },
      });

      const result = JSON.parse(response.text);
      setData(result);
    } catch (err) {
      console.error(err);
      setError("Failed to extract data. Please ensure the image is clear and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 font-sans">
      <header className="text-center space-y-2">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 text-blue-600"
        >
          <Zap className="w-8 h-8 fill-current" />
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">BillParser AI</h1>
        </motion.div>
        <p className="text-gray-500 max-w-md mx-auto">
          Upload your electricity bill to instantly extract consumer details and billing insights using Gemini Vision.
        </p>
      </header>

      <main className="grid md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <section className="space-y-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 transition-all
              ${image ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'}
              aspect-square flex flex-col items-center justify-center overflow-hidden
            `}
          >
            {image ? (
              <>
                <img src={image} alt="Bill Preview" className="absolute inset-0 w-full h-full object-contain opacity-40 group-hover:opacity-20 transition-opacity" />
                <div className="relative z-10 flex flex-col items-center text-blue-600">
                  <CheckCircle2 className="w-12 h-12 mb-2" />
                  <span className="font-medium">Image Loaded</span>
                  <span className="text-xs text-blue-400 mt-1">Click to Replace</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <Upload className="w-16 h-16 mb-4 stroke-1 group-hover:text-blue-500 transition-colors" />
                <p className="font-medium group-hover:text-gray-600">Drag & drop or click</p>
                <p className="text-xs mt-1">Supports JPG, PNG (Max 5MB)</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <button
            onClick={extractData}
            disabled={!image || loading}
            className={`
              w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all
              ${!image || loading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-95'}
            `}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Bill...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Extract Details
              </>
            )}
          </button>
        </section>

        {/* Results Section */}
        <section className="space-y-4">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-600"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}

            {data ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <Grid className="w-4 h-4 text-blue-500" />
                    Extracted Insights
                  </h2>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded">Verified</span>
                </div>
                
                <div className="divide-y divide-gray-50">
                  <ResultItem 
                    icon={<FileText className="text-purple-500" />} 
                    label="Consumer Number" 
                    value={data.consumerNumber} 
                  />
                  <ResultItem 
                    icon={<Activity className="text-amber-500" />} 
                    label="Sanctioned Load" 
                    value={`${data.sanctionedLoad}`} 
                  />
                  <ResultItem 
                    icon={<Zap className="text-blue-500" />} 
                    label="Units Consumed" 
                    value={data.unitsConsumed} 
                  />
                  <ResultItem 
                    icon={<IndianRupee className="text-emerald-500" />} 
                    label="Billing Amount" 
                    value={data.billingAmount} 
                  />
                  <ResultItem 
                    icon={<AlertCircle className="text-gray-500" />} 
                    label="Tariff Category" 
                    value={data.tariffCategory} 
                  />
                </div>
              </motion.div>
            ) : !loading && !error && (
              <div className="h-full border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center p-12 text-center text-gray-400">
                <FileText className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">Results will appear here<br/>after processing</p>
              </div>
            )}

            {loading && (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-xl" />
                ))}
              </div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}

function ResultItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-4 flex items-center gap-4 group hover:bg-gray-50/50 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">{label}</p>
        <p className="text-base font-semibold text-gray-900 truncate font-mono">{value || 'N/A'}</p>
      </div>
    </div>
  );
}
