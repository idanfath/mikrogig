import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { downloadLocallyAvailableImage } from '@/lib/image_utility';
import { login, logout, register } from '@/routes';
import app from '@/routes/app';
export default function Home() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
            <Head title="Home" />
            <div className="text-center">
                <h1 className="mb-2 text-4xl font-bold">
                    Selamat Datang di Home Page!
                </h1>
                <p className="text-lg text-gray-600">
                    Ini adalah halaman utama aplikasi Anda.
                </p>
            </div>

            <div className="flex flex-col gap-2">
                <p className="font-semibold text-gray-700">Common Route</p>
                <a href={login.url()} className="text-blue-500 hover:underline">
                    Login
                </a>
                <a
                    href={register.url()}
                    className="text-blue-500 hover:underline"
                >
                    Register
                </a>
                <a
                    href={app.home.url()}
                    className="text-blue-500 hover:underline"
                >
                    App
                </a>
                <a
                    onClick={() => {
                        router.post(logout.url());
                    }}
                    className="cursor-pointer text-blue-500 hover:underline"
                >
                    Logout
                </a>
            </div>

            <hr className="w-full max-w-md" />
        </div>
    );
}

// function CompressionTest() {
//   // TODO: refactor.
//   const [file, setFile] = useState<File | null>(null);
//   const [format, setFormat] = useState<string>('');
//   const [quality, setQuality] = useState<number>(80);
//   const [maxWidth, setMaxWidth] = useState<number | ''>('');
//   const [maxHeight, setMaxHeight] = useState<number | ''>('');
//   const [loading, setLoading] = useState(false);
//   const { csrf_token } = usePage().props;

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files?.[0]) {
//       setFile(e.target.files[0]);
//     }
//   };

//   const handleCompress = async () => {
//     if (!file) {
//       toast.error('Silakan pilih file gambar terlebih dahulu.');
//       return;
//     }

//     setLoading(true);
//     const toastId = toast.loading('Mengompres gambar...');

//     try {
//       const formData = new FormData();
//       formData.append('image', file);
//       if (format) formData.append('format', format);
//       formData.append('quality', quality.toString());
//       if (maxWidth) formData.append('maxWidth', maxWidth.toString());
//       if (maxHeight) formData.append('maxHeight', maxHeight.toString());

//       const response = await fetch(compress.url(), {
//         method: 'POST',
//         body: formData,
//         headers: {
//           'X-Requested-With': 'XMLHttpRequest',
//           'X-CSRF-Token': csrf_token,
//         },
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || `HTTP ${response.status}`);
//       }

//       const blob = await response.blob();
//       const compressedFile = new File([blob], file.name, { type: blob.type });

//       toast.dismiss(toastId);
//       toast.success('Gambar berhasil dikompres!');
//       downloadLocallyAvailableImage(compressedFile, file.name, false);
//     } catch (error) {
//       toast.dismiss(toastId);
//       toast.error(`Error: ${error instanceof Error ? error.message : 'Gagal mengompres gambar'}`);
//       console.error('Compression error:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex flex-col gap-4 w-full max-w-md border rounded-lg p-6 bg-gray-50">
//       <h2 className="text-2xl font-bold">Test Kompresi Gambar</h2>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Gambar</label>
//         <input
//           type="file"
//           accept="image/*"
//           onChange={handleFileChange}
//           disabled={loading}
//           className="w-full px-3 py-2 border border-gray-300 rounded-md"
//         />
//         {file && <p className="text-sm text-gray-600 mt-1">File: {file.name}</p>}
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">Format (Opsional)</label>
//         <select
//           value={format}
//           onChange={(e) => setFormat(e.target.value)}
//           disabled={loading}
//           className="w-full px-3 py-2 border border-gray-300 rounded-md"
//         >
//           <option value="">Gunakan format asli</option>
//           <option value="jpg">JPG</option>
//           <option value="png">PNG</option>
//           <option value="webp">WebP</option>
//         </select>
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           Kualitas: {quality}%
//         </label>
//         <input
//           type="range"
//           min="0"
//           max="100"
//           value={quality}
//           onChange={(e) => setQuality(Number(e.target.value))}
//           disabled={loading}
//           className="w-full"
//         />
//       </div>

//       <div className="grid grid-cols-2 gap-3">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Max Lebar (px)</label>
//           <input
//             type="number"
//             value={maxWidth}
//             onChange={(e) => setMaxWidth(e.target.value === '' ? '' : Number(e.target.value))}
//             disabled={loading}
//             placeholder="Tidak dibatasi"
//             className="w-full px-3 py-2 border border-gray-300 rounded-md"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Max Tinggi (px)</label>
//           <input
//             type="number"
//             value={maxHeight}
//             onChange={(e) => setMaxHeight(e.target.value === '' ? '' : Number(e.target.value))}
//             disabled={loading}
//             placeholder="Tidak dibatasi"
//             className="w-full px-3 py-2 border border-gray-300 rounded-md"
//           />
//         </div>
//       </div>

//       <button
//         onClick={handleCompress}
//         disabled={loading || !file}
//         className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
//       >
//         {loading ? 'Mengompres...' : 'Kompres Gambar'}
//       </button>
//     </div>
//   );
// }
