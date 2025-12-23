'use client';

import { useState, useEffect } from 'react';
import { getOrderConfirmationHtml, getShippingUpdateHtml, getOrderCancellationHtml } from '@/lib/email-templates';
import { getEmailLogs } from '@/app/[locale]/admin/(protected)/settings/actions';
import { Mail, RefreshCw, Eye, FileCode } from 'lucide-react';

// Mock Data for Preview
const mockOrder = {
  id: 'ord_123456789',
  totalAmount: 125.50,
  shippingAddress: {
    firstName: 'John',
    lastName: 'Doe',
    address1: '123 Vape St',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    country: 'US'
  },
  items: [
    {
      productTitleSnapshot: '高级电子烟套装',
      flavorSnapshot: '蓝莓冰',
      quantity: 1,
      unitPrice: 85.00
    },
    {
      productTitleSnapshot: '烟油补充装',
      flavorSnapshot: '薄荷',
      quantity: 3,
      unitPrice: 13.50
    }
  ],
  carrierName: '顺丰速运',
  trackingNumber: 'SF123456789012',
  trackingUrl: 'https://www.sf-express.com/cn/sc/dynamic_function/waybill/#search/bill-number/SF123456789012',
  guestEmail: 'john@example.com'
};

export default function EmailManager() {
  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'preview'>('logs');
  const [previewType, setPreviewType] = useState<'confirmation' | 'shipping' | 'cancellation'>('confirmation');
  const [htmlContent, setHtmlContent] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Load Logs
  const fetchLogs = () => {
    setLoadingLogs(true);
    getEmailLogs().then((res) => {
      if (res.success) {
        setLogs(res.data || []);
      }
      setLoadingLogs(false);
    });
  };

  useEffect(() => {
    if (activeSubTab === 'logs') {
      fetchLogs();
    }
  }, [activeSubTab]);

  // Update Preview
  useEffect(() => {
    let html = '';
    switch (previewType) {
      case 'confirmation':
        html = getOrderConfirmationHtml(mockOrder);
        break;
      case 'shipping':
        html = getShippingUpdateHtml(mockOrder);
        break;
      case 'cancellation':
        html = getOrderCancellationHtml(mockOrder, 'Out of stock');
        break;
    }
    setHtmlContent(html);
  }, [previewType]);

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex space-x-2 bg-zinc-900/50 p-1 rounded-lg w-fit border border-white/10">
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
            activeSubTab === 'logs'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Mail className="w-4 h-4" />
          发送记录 (Logs)
        </button>
        <button
          onClick={() => setActiveSubTab('preview')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
            activeSubTab === 'preview'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Eye className="w-4 h-4" />
          模板预览 (Preview)
        </button>
      </div>

      {/* Content */}
      {activeSubTab === 'logs' ? (
        <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-white font-medium">最近发送的邮件</h3>
            <button 
              onClick={fetchLogs}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="刷新"
            >
              <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-950 text-zinc-400 font-medium border-b border-white/10">
                <tr>
                  <th className="px-6 py-3">状态</th>
                  <th className="px-6 py-3">收件人</th>
                  <th className="px-6 py-3">主题</th>
                  <th className="px-6 py-3">时间</th>
                  <th className="px-6 py-3">错误信息</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loadingLogs && logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                      加载中...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                      暂无邮件发送记录
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            log.status === 'sent'
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          {log.status === 'sent' ? '发送成功' : '发送失败'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-300">{log.to}</td>
                      <td className="px-6 py-4 text-zinc-400">{log.subject}</td>
                      <td className="px-6 py-4 text-zinc-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-red-400 max-w-xs truncate">
                        {log.error || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Preview Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900 p-6 rounded-xl border border-white/10">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-zinc-400" />
                选择模板
              </h3>
              <div className="space-y-2">
                {(['confirmation', 'shipping', 'cancellation'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setPreviewType(type)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all border ${
                      previewType === type
                        ? 'bg-zinc-800 text-white border-zinc-700'
                        : 'bg-zinc-950 text-zinc-400 border-transparent hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                  >
                    {type === 'confirmation' && '📦 订单确认 (Order Confirmation)'}
                    {type === 'shipping' && '🚚 发货通知 (Shipping Update)'}
                    {type === 'cancellation' && '❌ 订单取消 (Order Cancellation)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900 p-6 rounded-xl border border-white/10">
              <h3 className="font-semibold text-white mb-4">HTML 源码</h3>
              <div className="bg-black rounded-lg p-4 overflow-x-auto border border-white/10">
                <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap break-all h-64 overflow-y-auto custom-scrollbar">
                  {htmlContent}
                </pre>
              </div>
            </div>
          </div>

          {/* Preview Frame */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden h-[800px] flex flex-col">
              <div className="bg-zinc-950 border-b border-white/10 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                </div>
                <span className="text-xs text-zinc-500 font-mono">
                  Preview Mode
                </span>
              </div>
              <div className="flex-1 bg-zinc-950 p-8 flex justify-center overflow-y-auto">
                <iframe
                  srcDoc={htmlContent}
                  className="w-full max-w-[600px] h-full bg-white shadow-lg rounded-sm"
                  style={{ border: 'none', minHeight: '100%' }}
                  title="Email Preview"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
