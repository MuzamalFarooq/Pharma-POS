import { Mail, Phone, MapPin, Send } from 'lucide-react';

export const metadata = {
  title: 'Contact Support - PharmaPulse SaaS',
};

export default function ContactPage() {
  return (
    <div className="py-8 sm:py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Get in Touch</h1>
        <p className="text-slate-600 text-base sm:text-lg">Have questions about our Pharmacy SaaS platform or enterprise plans?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Send Us a Message</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
              <input type="text" className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Dr. Jane Smith" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pharmacy Email</label>
              <input type="email" className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="jane@pharmacy.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Message</label>
              <textarea rows={4} className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="How can we help you?" />
            </div>
            <button type="button" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2">
              Send Message <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="space-y-6 bg-slate-900 text-white p-5 sm:p-8 rounded-2xl flex flex-col justify-between">
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Direct Support</h2>
            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-emerald-400" />
                <span>support@pharmapulse.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-400" />
                <span>+1 (800) 555-PHARMA</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />
                <span>100 Technology Plaza, Suite 400, New York, NY 10001</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-slate-800 rounded-xl text-xs text-slate-400 border border-slate-700">
            Support hours: 24/7 dedicated assistance for active pharmacy subscribers.
          </div>
        </div>
      </div>
    </div>
  );
}
