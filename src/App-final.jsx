import React, { useState, useEffect } from "react";
import { db, auth, storage } from "./firebase";
import {
  collection, addDoc, getDocs, deleteDoc, updateDoc, doc, setDoc, getDoc
} from "firebase/firestore";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import dataProduk from "./data/data_produk_bangunan.json";

function App() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("");
  const [image, setImage] = useState(null);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        const data = docSnap.data();
        setRole(data?.role || "viewer");
        getProducts();
      }
    });
  }, []);

  const getProducts = async () => {
    const querySnapshot = await getDocs(collection(db, "products"));
    setProducts(querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  const resetForm = () => {
    setName(""); setPrice(""); setCategory(""); setStock(""); setUnit("");
    setImage(null); setEditId(null);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price.trim()) return alert("Nama dan harga wajib diisi");

    let imageUrl = "";
    if (image) {
      const imageRef = ref(storage, `product-images/${image.name}-${Date.now()}`);
      const snapshot = await uploadBytes(imageRef, image);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    const data = { name, price, category, stock, unit, imageUrl };

    if (editId) {
      await updateDoc(doc(db, "products", editId), data);
      alert("Produk diperbarui!");
    } else {
      await addDoc(collection(db, "products"), data);
      alert("Produk ditambahkan!");
    }

    resetForm(); getProducts();
  };

  const handleDelete = async (id) => {
    if (confirm("Hapus produk ini?")) {
      await deleteDoc(doc(db, "products", id));
      alert("Produk dihapus");
      getProducts();
    }
  };

  const handleEdit = (product) => {
    setEditId(product.id);
    setName(product.name); setPrice(product.price);
    setCategory(product.category || ""); setStock(product.stock || "");
    setUnit(product.unit || ""); setImage(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail(""); setPassword("");
      alert("Login sukses");
    } catch (err) {
      alert("Login gagal: " + err.message);
    }
  };

  const handleRegisterAdmin = async () => {
    if (!email || !password) return alert("Email & password harus diisi");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        role: "admin"
      });
      alert("Admin berhasil dibuat. Silakan login.");
      setEmail("");
      setPassword("");
    } catch (error) {
      alert("Gagal daftar admin: " + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null); setProducts([]); setRole("");
    alert("Logout berhasil");
  };

  const importProdukFromJSON = async () => {
    const existingSnapshot = await getDocs(collection(db, "products"));
    const existingNames = existingSnapshot.docs.map(doc => doc.data().name.toLowerCase());

    let imported = 0;
    for (const item of dataProduk) {
      if (!item.name || existingNames.includes(item.name.toLowerCase())) continue;

      await addDoc(collection(db, "products"), {
        name: item.name,
        price: item.price,
        category: item.category || "",
        stock: item.stock || "",
        unit: item.unit || "",
        imageUrl: item.imageUrl || ""
      });

      imported++;
    }

    alert(`${imported} produk berhasil diimpor`);
    getProducts();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-6 underline">BangunRumah App</h1>

      {!user ? (
        <form onSubmit={handleLogin} className="max-w-sm mx-auto bg-white p-6 rounded shadow space-y-4">
          <h2 className="text-xl font-semibold text-center text-gray-700">Login Admin</h2>
          <input type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} className="w-full border px-3 py-2 rounded" />
          <input type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} className="w-full border px-3 py-2 rounded" />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Login</button>
          <button type="button" onClick={handleRegisterAdmin} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
            Daftar Admin
          </button>
        </form>
      ) : (
        <>
          <div className="max-w-xl mx-auto flex justify-between items-center mb-6">
            <p className="text-gray-700 font-medium">Login sebagai: {user.email} ({role})</p>
            <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">Logout</button>
          </div>

          {role === "admin" && (
            <>
              <form onSubmit={handleAddProduct} className="max-w-xl mx-auto bg-white shadow-lg p-6 rounded-xl mb-8 space-y-4">
                <input type="text" placeholder="Nama produk" value={name} onChange={(e) => setName(e.target.value)} className="w-full border px-3 py-2 rounded" />
                <input type="number" placeholder="Harga" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border px-3 py-2 rounded" />
                <input type="text" placeholder="Kategori" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border px-3 py-2 rounded" />
                <input type="number" placeholder="Stok" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full border px-3 py-2 rounded" />
                <input type="text" placeholder="Satuan" value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full border px-3 py-2 rounded" />
                <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} className="w-full border px-3 py-2 rounded" />
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                  {editId ? "Simpan Perubahan" : "Tambah Produk"}
                </button>
              </form>

              <div className="max-w-xl mx-auto mb-4">
                <button onClick={importProdukFromJSON} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full">
                  Import Produk dari JSON
                </button>
              </div>
            </>
          )}

          <div className="max-w-xl mx-auto mb-4">
            <input type="text" placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full border px-4 py-2 rounded" />
          </div>

          <div className="max-w-xl mx-auto space-y-3">
            {products
              .filter((product) => product.name.toLowerCase().includes(search.toLowerCase()))
              .map((product) => (
                <div key={product.id} className="flex gap-4 items-start border-b pb-4">
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.name} className="w-20 h-20 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      Rp{parseInt(product.price).toLocaleString("id-ID")} {product.unit ? `/${product.unit}` : ""}
                    </p>
                    {product.category && <p className="text-sm text-gray-500">Kategori: {product.category}</p>}
                    {product.stock && <p className="text-sm text-gray-500">Stok: {product.stock} {product.unit || ""}</p>}
                  </div>
                  {role === "admin" && (
                    <div className="flex flex-col gap-2">
                      <button onClick={() => handleEdit(product)} className="text-blue-500 hover:underline text-sm">Edit</button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:underline text-sm">Hapus</button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
