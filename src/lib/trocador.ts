import axios from 'axios';

const TROCADOR_API_URL = 'https://trocador.app/api';

interface CreateTradeParams {
  ticker_to: string;    // 商户接收 (xmr)
  network_to: string;   // 商户网络 (mainnet)
  address_to: string;   // 商户地址
  ticker_from: string;  // 用户支付 (btc/ltc...)
  network_from: string; // 用户网络
  amount_to: number;    // 商户应收到的 XMR 数量
}

// 1. 获取汇率估算 (USD -> XMR)
// 因为订单是 USD，但我们告诉 Trocador 我们要收 XMR，所以需要自己算一下要收多少 XMR
export async function getEstimatedXmrAmount(amountUsd: number): Promise<number | null> {
  try {
    // 使用 CoinGecko 免费接口获取 XMR 价格
    const res = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=monero&vs_currencies=usd');
    const rate = res.data.monero.usd;
    
    if (!rate || rate <= 0) return null;
    
    // 计算需要的 XMR 数量，保留5位小数防波动
    const xmrAmount = amountUsd / rate;
    return Number(xmrAmount.toFixed(5));
  } catch (e) {
    console.error("Failed to fetch XMR rates:", e);
    return null;
  }
}

// 2. 创建交易
export async function createTrocadorTrade(params: CreateTradeParams) {
  try {
    const payload = {
      ...params,
      min_amount: 0, 
    };

    const headers = process.env.TROCADOR_API_KEY 
      ? { 'api-key': process.env.TROCADOR_API_KEY } 
      : {};

    const response = await axios.post(`${TROCADOR_API_URL}/new_trade`, payload, { headers });
    
    // 返回数据通常包含: trade_id, address_from (充值地址), amount_from (用户需付金额)
    return response.data;
  } catch (error) {
    console.error('Trocador Create Trade Error:', error);
    throw new Error('Failed to create crypto payment');
  }
}

// 3. 查询状态
export async function getTrocadorTradeStatus(tradeId: string) {
  try {
    const headers = process.env.TROCADOR_API_KEY 
      ? { 'api-key': process.env.TROCADOR_API_KEY } 
      : {};

    const response = await axios.get(`${TROCADOR_API_URL}/trade_status`, {
      params: { id: tradeId },
      headers
    });
    return response.data; // { status: "finished" | "waiting" | ... }
  } catch (error) {
    console.error('Trocador Status Check Error:', error);
    return null;
  }
}