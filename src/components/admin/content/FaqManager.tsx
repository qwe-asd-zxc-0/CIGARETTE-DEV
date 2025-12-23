"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import { createFaq, updateFaq, deleteFaq } from "@/app/[locale]/admin/(protected)/content/actions";

export default function FaqManager({ faqs }: { faqs: any[] }) {
  const [isEditing, setIsEditing] = useState<string | null>(null); // 'new' or id
  const [formData, setFormData] = useState({ question: "", answer: "", category: "General" });

  const categories = ["General", "Shipping", "Payment", "Returns", "Product"];

  const handleEdit = (faq: any) => {
    setIsEditing(faq.id);
    setFormData({ question: faq.question, answer: faq.answer, category: faq.category });
  };

  const handleNew = () => {
    setIsEditing("new");
    setFormData({ question: "", answer: "", category: "General" });
  };

  const handleSave = async () => {
    if (!formData.question || !formData.answer) return alert("Please fill all fields");

    if (isEditing === "new") {
      await createFaq(formData);
    } else if (isEditing) {
      await updateFaq(isEditing, formData);
    }
    setIsEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this FAQ?")) await deleteFaq(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">Frequently Asked Questions</h3>
        <button 
          onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-all"
        >
          <Plus className="w-4 h-4" /> Add FAQ
        </button>
      </div>

      {/* 编辑表单 (新增或修改时显示) */}
      {isEditing && (
        <div className="bg-zinc-800/50 border border-red-500/30 rounded-xl p-6 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-white">{isEditing === 'new' ? 'New FAQ' : 'Edit FAQ'}</h4>
            <button onClick={() => setIsEditing(null)}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs text-zinc-500 uppercase font-bold">Question</label>
              <input 
                value={formData.question}
                onChange={(e) => setFormData({...formData, question: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-red-500 outline-none"
                placeholder="e.g. How long does shipping take?"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 uppercase font-bold">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-red-500 outline-none appearance-none"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-3 space-y-2">
              <label className="text-xs text-zinc-500 uppercase font-bold">Answer</label>
              <textarea 
                value={formData.answer}
                onChange={(e) => setFormData({...formData, answer: e.target.value})}
                rows={4}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-red-500 outline-none resize-none"
                placeholder="Type the answer here..."
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors"
            >
              <Save className="w-4 h-4" /> Save FAQ
            </button>
          </div>
        </div>
      )}

      {/* FAQ 列表 */}
      <div className="grid gap-3">
        {faqs.map((faq) => (
          <div key={faq.id} className="group bg-zinc-900 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] uppercase font-bold rounded">
                    {faq.category}
                  </span>
                  <h4 className="text-white font-medium">{faq.question}</h4>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed pl-1 border-l-2 border-white/10">
                  {faq.answer}
                </p>
              </div>
              
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(faq)}
                  className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:text-white hover:bg-zinc-700"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(faq.id)}
                  className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:text-red-500 hover:bg-zinc-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {faqs.length === 0 && !isEditing && (
          <div className="text-center py-12 text-zinc-500">No FAQs created yet.</div>
        )}
      </div>
    </div>
  );
}