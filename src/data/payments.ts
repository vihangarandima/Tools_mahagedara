// Online card / LankaQR / Koko payments are only a front-end simulation: no money is charged.
// Keep this false until a real payment gateway (e.g. PayHere or LankaPay) is integrated
// with the store's merchant account; while false, the "Pay Online" buttons are hidden and
// checkout only offers COD, bank transfer, WhatsApp confirmation and quotations.
export const ONLINE_PAYMENTS_ENABLED = false;
