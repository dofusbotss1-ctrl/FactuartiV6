// src/components/clients/ClientDetailView.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Receipt, Plus, Eye } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useOrder } from '../../contexts/OrderContext';
import CreateInvoiceFromOrderModal from '../orders/CreateInvoiceFromOrderModal';

type Props = { clientId: string; onBack: () => void };

const nf2 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d?: string | number) => (d ? new Date(d).toLocaleString('fr-FR') : '-');

export default function ClientDetailView({ clientId, onBack }: Props) {
  const { clients, invoices } = useData();
  const { orders } = useOrder();
  const [createForOrder, setCreateForOrder] = React.useState<string | null>(null);

  const client = React.useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);

  const clientOrders = React.useMemo(
    () => orders.filter((o: any) => o.clientId === clientId || o.client?.id === clientId),
    [orders, clientId]
  );

  const clientInvoices = React.useMemo(
    () => invoices.filter((i) => i.clientId === clientId),
    [invoices, clientId]
  );

  const { totalAmount, paidAmount, unpaidAmount } = React.useMemo(() => {
    const paidStatuses = new Set(['paid', 'collected']);
    let total = 0, paid = 0, unpaid = 0;
    for (const inv of clientInvoices) {
      const v = Number(inv.totalTTC || 0);
      total += v;
      if (paidStatuses.has(inv.status)) paid += v;
      else unpaid += v;
    }
    return { totalAmount: total, paidAmount: paid, unpaidAmount: unpaid };
  }, [clientInvoices]);

  if (!client) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm mb-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <p className="text-red-600">Client introuvable.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
          </button>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{client.name}</h2>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {[client.address, client.phone && `Tél: ${client.phone}`, client.email].filter(Boolean).join(' | ')}
          </div>
        </div>
      </div>

      {/* Résumé financier */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} whileHover={{ scale: 1.01 }} className="rounded-xl border bg-white dark:bg-gray-900 border-blue-200 dark:border-blue-800 p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">MAD Total Factures</div>
          <div className="text-3xl font-bold text-blue-600 mt-1">{nf2.format(totalAmount)}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }} whileHover={{ scale: 1.01 }} className="rounded-xl border bg-white dark:bg-gray-900 border-emerald-200 dark:border-emerald-800 p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">MAD Total Payées</div>
          <div className="text-3xl font-bold text-emerald-600 mt-1">{nf2.format(paidAmount)}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} whileHover={{ scale: 1.01 }} className="rounded-xl border bg-white dark:bg-gray-900 border-red-200 dark:border-red-800 p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">MAD À payer</div>
          <div className="text-3xl font-bold text-red-600 mt-1">{nf2.format(unpaidAmount)}</div>
        </motion.div>
      </div>

      {/* Commandes */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Commandes</h3>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{clientOrders.length} commande(s)</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/60">
              <tr>
                <th className="px-4 py-2 text-left text-xs uppercase text-gray-500 dark:text-gray-300">N°</th>
                <th className="px-4 py-2 text-left text-xs uppercase text-gray-500 dark:text-gray-300">Date</th>
                <th className="px-4 py-2 text-left text-xs uppercase text-gray-500 dark:text-gray-300">Total TTC</th>
                <th className="px-4 py-2 text-left text-xs uppercase text-gray-500 dark:text-gray-300">Statut</th>
                <th className="px-4 py-2 text-left text-xs uppercase text-gray-500 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {clientOrders.map((o: any) => {
                const linkedInvoice = clientInvoices.find((inv: any) => inv.orderId === o.id);
                return (
                  <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{o.number}</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{fmtDate(o.orderDate)}</td>
                    <td className="px-4 py-2 font-semibold text-gray-900 dark:text-gray-100">{nf2.format(o.totalTTC || 0)} MAD</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{o.status || '-'}</td>
                    <td className="px-4 py-2">
                      {linkedInvoice ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            Facture créée
                          </span>
                          {/* Aller vers la liste des factures avec focus */}
                          <Link
                            to={`/invoices?focus=${linkedInvoice.id}`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            title="Voir la facture dans la liste"
                          >
                            <Eye className="w-4 h-4" /> Voir
                          </Link>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCreateForOrder(o.id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" /> Créer Facture
                        </button>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
              {clientOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-gray-500 dark:text-gray-400">Aucune commande.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Factures (affichage local) */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Factures</h3>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{clientInvoices.length} facture(s)</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/60">
              <tr>
                <th className="px-4 py-2 text-left text-xs uppercase text-gray-500 dark:text-gray-300">N°</th>
                <th className="px-4 py-2 text-left text-xs uppercase text-gray-500 dark:text-gray-300">Date</th>
                <th className="px-4 py-2 text-left text-xs uppercase text-gray-500 dark:text-gray-300">Total TTC</th>
                <th className="px-4 py-2 text-left text-xs uppercase text-gray-500 dark:text-gray-300">Statut</th>
                <th className="px-4 py-2 text-left text-xs uppercase text-gray-500 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {clientInvoices.map((inv) => (
                <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{inv.number}</td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{fmtDate(inv.date)}</td>
                  <td className="px-4 py-2 font-semibold text-gray-900 dark:text-gray-100">{nf2.format(inv.totalTTC || 0)} MAD</td>
                  <td className="px-4 py-2">
                    <span className={
                      'px-2 py-0.5 rounded text-xs font-medium ' +
                      (inv.status === 'paid' || inv.status === 'collected'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : inv.status === 'draft'
                        ? 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300')
                    }>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {/* Voir directement dans la liste globale des factures */}
                    <Link
                      
                      to={`/invoices?focus=${inv.id}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      title="Voir dans la liste des factures"
                    >
                      <Eye className="w-4 h-4" /> Voir
                    </Link>
                  </td>
                </motion.tr>
              ))}
              {clientInvoices.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-gray-500 dark:text-gray-400">Aucune facture.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {createForOrder && (
        <CreateInvoiceFromOrderModal
          orderId={createForOrder}
          isOpen
          onClose={() => setCreateForOrder(null)}
          onInvoiceCreated={() => setCreateForOrder(null)}
        />
      )}
    </div>
  );
}
