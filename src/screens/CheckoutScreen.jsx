/**
 * CheckoutScreen — Proceso de compra en 3 pasos
 * Paso 1: Dirección de entrega
 * Paso 2: Horario + método de pago
 * Paso 3: Resumen y confirmación
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Clock, CreditCard, Banknote, CheckCircle2, Store } from 'lucide-react';
import Button from '../components/Button';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { createOrder } from '../mocks/mockOrders';
import { formatCurrency } from '../utils/formatters';
import { ROUTES } from '../utils/constants';

// ─── Datos de Puebla para el formulario ──────────────────────────────────────
const MUNICIPIOS = [
  'Puebla',
  'San Andrés Cholula',
  'San Pedro Cholula',
  'Cuautlancingo',
  'Amozoc',
  'Atlixco',
  'Tehuacán',
  'Chignahuapan',
];

const DELIVERY_SLOTS = [
  { id: 'morning',   label: 'Mañana temprano',  time: '7:00 – 10:00 am', emoji: '🌅', extra: 'Más fresco' },
  { id: 'afternoon', label: 'Mañana tarde',      time: '2:00 – 6:00 pm',  emoji: '☀️', extra: '' },
  { id: 'express',   label: 'Hoy por la tarde',  time: '4:00 – 7:00 pm',  emoji: '⚡', extra: '+$20 express' },
];

const PAYMENT_METHODS = [
  { id: 'cash',   label: 'Efectivo al recibir', icon: Banknote,     desc: 'Paga cuando llegue tu pedido' },
  { id: 'card',   label: 'Tarjeta (simulado)',  icon: CreditCard,   desc: 'Visa / Mastercard / OXXO Pay' },
];

const PICKUP_POINTS = [
  { id: 'pp1', name: 'Mercado Municipal El Alto',   address: 'Blvd. Héroes del 5 de Mayo 3009, El Alto, Puebla',   schedule: 'Lun–Sáb 7:00 – 14:00' },
  { id: 'pp2', name: 'Plaza de San Andrés Cholula', address: 'Av. Morelos 14, San Andrés Cholula, Puebla',           schedule: 'Lun–Dom 8:00 – 15:00' },
  { id: 'pp3', name: 'Tianguis Atlixcáyotl',        address: 'Blvd. del Niño Poblano S/N, Reserva Atlixcáyotl',    schedule: 'Sáb–Dom 7:00 – 13:00' },
];

export default function CheckoutScreen() {
  const navigate      = useNavigate();
  const { items, totals, clearCart } = useCart();
  const { currentUser }              = useAuth();
  const { showToast }                = useToast();

  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);

  // ─── Datos del formulario ───────────────────────────────────────────────────
  const [address, setAddress] = useState({
    name:       currentUser?.name || '',
    phone:      currentUser?.phone || '',
    street:     '',
    exterior:   '',
    interior:   '',
    colonia:    '',
    municipio:  'Puebla',
    references: '',
  });

  const [deliverySlot,   setDeliverySlot]   = useState('morning');
  const [paymentMethod,  setPaymentMethod]  = useState('cash');
  const [cardData,       setCardData]       = useState({ number: '', name: '', expiry: '', cvv: '' });

  // ─── Dirección guardada ─────────────────────────────────────────────────────
  const savedAddrKey = currentUser && currentUser.id !== 'guest'
    ? `agro_saved_addr_${currentUser.id}` : null;
  const [savedAddress,       setSavedAddress]       = useState(() => {
    if (!savedAddrKey) return null;
    try { return JSON.parse(localStorage.getItem(savedAddrKey)); } catch { return null; }
  });
  const [saveAddressChecked, setSaveAddressChecked] = useState(false);

  // ─── Tipo de entrega ─────────────────────────────────────────────────────────
  const [deliveryType,   setDeliveryType]   = useState('home'); // 'home' | 'pickup'
  const [selectedPickup, setSelectedPickup] = useState(null);

  // ─── Validaciones por paso ──────────────────────────────────────────────────
  const isStep1Valid = deliveryType === 'pickup'
    ? !!selectedPickup
    : address.name.trim() && address.phone.trim() &&
      address.street.trim() && address.colonia.trim();

  const isStep2Valid = !!deliverySlot && !!paymentMethod;

  // ─── Totales efectivos (sin envío si es recolecta) ─────────────────────────────────────
  const effectiveTotals = useMemo(() => {
    if (deliveryType === 'pickup') {
      return { ...totals, shipping: 0, total: totals.subtotal - totals.discount };
    }
    return totals;
  }, [deliveryType, totals]);

  // ─── Confirmar pedido ───────────────────────────────────────────────────────
  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      const order = await createOrder({
        items,
        totals: effectiveTotals,
        deliveryInfo: {
          type: deliveryType,
          ...(deliveryType === 'home'
            ? { address }
            : { pickup: PICKUP_POINTS.find((p) => p.id === selectedPickup) }),
          slot: DELIVERY_SLOTS.find((s) => s.id === deliverySlot),
        },
        paymentMethod,
        userId: currentUser?.id || 'guest',
      });

      clearCart();
      navigate(ROUTES.ORDER_SUCCESS, { state: { order }, replace: true });
    } catch {
      showToast({ message: 'Error al procesar el pedido. Inténtalo de nuevo.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [items, totals, address, deliverySlot, paymentMethod, currentUser, clearCart, navigate, showToast]);

  // ─── Redirección si carrito vacío ──────────────────────────────────────────
  useEffect(() => {
    if (items.length === 0) {
      navigate(ROUTES.CATALOG, { replace: true });
    }
  }, [items.length, navigate]);

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-90"
          >
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="font-bold text-gray-900 flex-1">Checkout</h1>
          <span className="text-sm text-gray-400 font-medium">Paso {step} de 3</span>
        </div>

        {/* Barra de progreso */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-primary-500 transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="pb-32">
        {/* ─── Paso 1: Dirección ──────────────────────────────────── */}
        {step === 1 && (
          <AddressStep
            address={address}
            onChange={setAddress}
            deliveryType={deliveryType}
            onDeliveryTypeChange={setDeliveryType}
            selectedPickup={selectedPickup}
            onPickupChange={setSelectedPickup}
            savedAddress={savedAddress}
            saveAddressChecked={saveAddressChecked}
            onSaveAddressChange={setSaveAddressChecked}
          />
        )}

        {/* ─── Paso 2: Entrega y pago ─────────────────────────────── */}
        {step === 2 && (
          <DeliveryPaymentStep
            deliverySlot={deliverySlot}
            paymentMethod={paymentMethod}
            cardData={cardData}
            onSlotChange={setDeliverySlot}
            onPaymentChange={setPaymentMethod}
            onCardChange={setCardData}
          />
        )}

        {/* ─── Paso 3: Resumen ─────────────────────────────────────── */}
        {step === 3 && (
          <SummaryStep
            items={items}
            totals={effectiveTotals}
            deliveryType={deliveryType}
            address={address}
            selectedPickup={PICKUP_POINTS.find((p) => p.id === selectedPickup)}
            deliverySlot={DELIVERY_SLOTS.find((s) => s.id === deliverySlot)}
            paymentMethod={PAYMENT_METHODS.find((p) => p.id === paymentMethod)}
          />
        )}
      </div>

      {/* ─── CTA fijo ─────────────────────────────────────────────── */}
      <div className="fixed bottom-14 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-2xl">
        <div className="px-4 py-3 max-w-lg mx-auto">
          {step < 3 ? (
            <Button
              size="full"
              disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
              onClick={() => {
                if (step === 1 && saveAddressChecked && savedAddrKey) {
                  localStorage.setItem(savedAddrKey, JSON.stringify(address));
                  setSavedAddress(address);
                }
                setStep(step + 1);
              }}
            >
              {step === 1 ? 'Continuar a entrega y pago' : 'Revisar mi pedido'}
            </Button>
          ) : (
            <Button
              size="full"
              loading={loading}
              onClick={handleConfirm}
              icon={<CheckCircle2 size={18} />}
            >
              Confirmar pedido — {formatCurrency(effectiveTotals.total)}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Paso 1: Dirección ────────────────────────────────────────────────────────
function AddressStep({
  address, onChange,
  deliveryType, onDeliveryTypeChange,
  selectedPickup, onPickupChange,
  savedAddress, saveAddressChecked, onSaveAddressChange,
}) {
  function set(field, value) {
    onChange((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="px-4 py-4 space-y-5">

      {/* ── Toggle tipo de entrega ── */}
      <div className="bg-white rounded-2xl p-1 flex border border-gray-200 shadow-sm">
        <button
          onClick={() => onDeliveryTypeChange('home')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all
            ${deliveryType === 'home' ? 'bg-primary-500 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <MapPin size={16} />
          A domicilio
        </button>
        <button
          onClick={() => onDeliveryTypeChange('pickup')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all
            ${deliveryType === 'pickup' ? 'bg-primary-500 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Store size={16} />
          Punto de recolecta
        </button>
      </div>

      {deliveryType === 'pickup' ? (
        /* ── Lista de puntos de recolecta ── */
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Store size={20} className="text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900">Elige dónde recoger</h2>
          </div>
          <div className="bg-primary-50 border border-primary-100 rounded-xl px-3 py-2">
            <p className="text-xs text-primary-700 font-medium">🎉 Sin costo de envío al recoger en punto</p>
          </div>
          {PICKUP_POINTS.map((pt) => (
            <button
              key={pt.id}
              onClick={() => onPickupChange(pt.id)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all
                ${selectedPickup === pt.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5
                  ${selectedPickup === pt.id ? 'bg-primary-100' : 'bg-gray-100'}`}>
                  <Store size={18} className={selectedPickup === pt.id ? 'text-primary-600' : 'text-gray-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${selectedPickup === pt.id ? 'text-primary-700' : 'text-gray-900'}`}>
                    {pt.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{pt.address}</p>
                  <p className="text-xs text-gray-400 mt-0.5">⏰ {pt.schedule}</p>
                </div>
                {selectedPickup === pt.id && (
                  <CheckCircle2 size={20} className="text-primary-600 flex-shrink-0 mt-0.5" />
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* ── Formulario de domicilio ── */
        <>
          <div className="flex items-center gap-2">
            <MapPin size={20} className="text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900">Dirección de entrega</h2>
          </div>

          {/* Banner dirección guardada */}
          {savedAddress && (
            <div className="bg-primary-50 border border-primary-200 rounded-2xl p-3.5">
              <p className="text-xs font-semibold text-primary-700 mb-1">📍 Dirección guardada</p>
              <p className="text-sm text-gray-800 font-medium leading-snug">
                {savedAddress.street} {savedAddress.exterior}, {savedAddress.colonia}
              </p>
              <p className="text-xs text-gray-500">{savedAddress.municipio}, Puebla</p>
              <button
                onClick={() => onChange({ ...savedAddress })}
                className="mt-2 text-xs font-semibold text-primary-600 underline underline-offset-2"
              >
                Usar esta dirección
              </button>
            </div>
          )}

          {/* Nombre y teléfono */}
          <div className="grid grid-cols-1 gap-3">
            <Field label="Nombre completo *">
              <input
                value={address.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="¿A nombre de quién se entrega?"
                className={inputCls}
              />
            </Field>
            <Field label="Teléfono de contacto *">
              <input
                value={address.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="10 dígitos"
                inputMode="numeric"
                maxLength={10}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Calle y número */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Calle *" className="col-span-2">
              <input
                value={address.street}
                onChange={(e) => set('street', e.target.value)}
                placeholder="Av. Reforma"
                className={inputCls}
              />
            </Field>
            <Field label="Núm. ext *">
              <input
                value={address.exterior}
                onChange={(e) => set('exterior', e.target.value)}
                placeholder="123"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Núm. int">
              <input
                value={address.interior}
                onChange={(e) => set('interior', e.target.value)}
                placeholder="Apt 4B"
                className={inputCls}
              />
            </Field>
            <Field label="Colonia *">
              <input
                value={address.colonia}
                onChange={(e) => set('colonia', e.target.value)}
                placeholder="Col. Centro"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Municipio *">
            <select
              value={address.municipio}
              onChange={(e) => set('municipio', e.target.value)}
              className={inputCls}
            >
              {MUNICIPIOS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Field>

          <Field label="Referencias (opcional)">
            <textarea
              value={address.references}
              onChange={(e) => set('references', e.target.value)}
              placeholder="Entre calles, color de la fachada, referencias..."
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </Field>

          {/* Guardar dirección */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={saveAddressChecked}
              onChange={(e) => onSaveAddressChange(e.target.checked)}
              className="w-4 h-4 rounded accent-primary-500"
            />
            <span className="text-sm text-gray-600">Guardar como mi dirección predeterminada</span>
          </label>

          <p className="text-xs text-gray-400">
            * Solo entregamos en el estado de Puebla. Campos marcados con * son obligatorios.
          </p>
        </>
      )}
    </div>
  );
}

// ─── Paso 2: Entrega y pago ───────────────────────────────────────────────────
function DeliveryPaymentStep({ deliverySlot, paymentMethod, cardData, onSlotChange, onPaymentChange, onCardChange }) {
  return (
    <div className="px-4 py-4 space-y-6">
      {/* Horario de entrega */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={20} className="text-primary-600" />
          <h2 className="text-lg font-bold text-gray-900">Horario de entrega</h2>
        </div>
        <div className="space-y-2">
          {DELIVERY_SLOTS.map((slot) => (
            <button
              key={slot.id}
              onClick={() => onSlotChange(slot.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left min-h-[72px]
                ${deliverySlot === slot.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
            >
              <span className="text-2xl flex-shrink-0">{slot.emoji}</span>
              <div className="flex-1">
                <p className={`font-semibold text-sm ${deliverySlot === slot.id ? 'text-primary-700' : 'text-gray-900'}`}>
                  {slot.label}
                </p>
                <p className="text-xs text-gray-500">{slot.time}</p>
              </div>
              {slot.extra && (
                <span className="text-[11px] bg-earth-100 text-earth-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                  {slot.extra}
                </span>
              )}
              {deliverySlot === slot.id && (
                <CheckCircle2 size={20} className="text-primary-600 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Método de pago */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CreditCard size={20} className="text-primary-600" />
          <h2 className="text-lg font-bold text-gray-900">Método de pago</h2>
        </div>
        <div className="space-y-2">
          {PAYMENT_METHODS.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                onClick={() => onPaymentChange(method.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left min-h-[68px]
                  ${paymentMethod === method.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                  ${paymentMethod === method.id ? 'bg-primary-100' : 'bg-gray-100'}`}>
                  <Icon size={20} className={paymentMethod === method.id ? 'text-primary-600' : 'text-gray-500'} />
                </div>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${paymentMethod === method.id ? 'text-primary-700' : 'text-gray-900'}`}>
                    {method.label}
                  </p>
                  <p className="text-xs text-gray-500">{method.desc}</p>
                </div>
                {paymentMethod === method.id && (
                  <CheckCircle2 size={20} className="text-primary-600 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Campos de tarjeta (simulados) */}
        {paymentMethod === 'card' && (
          <div className="mt-4 bg-white rounded-2xl p-4 border border-gray-200 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Datos de la tarjeta (simulado)
            </p>
            <Field label="Número de tarjeta">
              <input
                value={cardData.number}
                onChange={(e) => {
                  // Solo dígitos, máx 16
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
                  // Formato xxxx xxxx xxxx xxxx
                  const formatted = digits.replace(/(.{4})/g, '$1 ').trimEnd();
                  onCardChange((p) => ({ ...p, number: formatted }));
                }}
                placeholder="1234 5678 9012 3456"
                inputMode="numeric"
                maxLength={19}
                className={inputCls}
              />
            </Field>
            <Field label="Nombre en la tarjeta">
              <input
                value={cardData.name}
                onChange={(e) => onCardChange((p) => ({ ...p, name: e.target.value.toUpperCase() }))}
                placeholder="JUAN PÉREZ GARCÍA"
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Vencimiento">
                <input
                  value={cardData.expiry}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                    // Inserta slash automáticamente después del mes
                    const formatted = digits.length > 2
                      ? `${digits.slice(0, 2)}/${digits.slice(2)}`
                      : digits;
                    onCardChange((p) => ({ ...p, expiry: formatted }));
                  }}
                  placeholder="MM/AA"
                  inputMode="numeric"
                  maxLength={5}
                  className={inputCls}
                />
              </Field>
              <Field label="CVV">
                <input
                  value={cardData.cvv}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                    onCardChange((p) => ({ ...p, cvv: digits }));
                  }}
                  placeholder="123"
                  inputMode="numeric"
                  maxLength={4}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Paso 3: Resumen ──────────────────────────────────────────────────────────
function SummaryStep({ items, totals, deliveryType, address, selectedPickup, deliverySlot, paymentMethod }) {
  const PayIcon = paymentMethod?.icon;
  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Revisa tu pedido</h2>

      {/* Productos */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="font-semibold text-gray-700 text-sm mb-3">
          Productos ({items.length})
        </p>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={item.image} alt={item.name} className="w-9 h-9 rounded-lg object-cover bg-gray-100" />
                <div>
                  <p className="text-sm font-medium text-gray-900 leading-tight">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.qty} {item.unit}</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.price * item.qty)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dirección / Punto de recolecta */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          {deliveryType === 'pickup'
            ? <Store size={15} className="text-gray-400" />
            : <MapPin size={15} className="text-gray-400" />}
          <p className="font-semibold text-gray-700 text-sm">
            {deliveryType === 'pickup' ? 'Punto de recolecta' : 'Entrega en'}
          </p>
        </div>
        {deliveryType === 'pickup' && selectedPickup ? (
          <>
            <p className="text-sm text-gray-900 font-medium">{selectedPickup.name}</p>
            <p className="text-sm text-gray-600">{selectedPickup.address}</p>
            <p className="text-xs text-gray-400 mt-0.5">⏰ {selectedPickup.schedule}</p>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-900 font-medium">{address.name}</p>
            <p className="text-sm text-gray-600">
              {address.street} {address.exterior}{address.interior ? ` Int. ${address.interior}` : ''}, {address.colonia}
            </p>
            <p className="text-sm text-gray-500">{address.municipio}, Puebla</p>
            {address.references && (
              <p className="text-xs text-gray-400 mt-1">{address.references}</p>
            )}
          </>
        )}
      </div>

      {/* Horario y pago */}
      <div className="bg-white rounded-2xl p-4 shadow-sm grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={14} className="text-gray-400" />
            <p className="text-xs font-semibold text-gray-500">Horario</p>
          </div>
          <p className="text-sm font-medium text-gray-900">{deliverySlot?.label}</p>
          <p className="text-xs text-gray-400">{deliverySlot?.time}</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            {PayIcon && <PayIcon size={14} className="text-gray-400" />}
            <p className="text-xs font-semibold text-gray-500">Pago</p>
          </div>
          <p className="text-sm font-medium text-gray-900">{paymentMethod?.label}</p>
        </div>
      </div>

      {/* Totales */}
      <div className="bg-primary-50 rounded-2xl p-4">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Envío</span>
            <span className={totals.shipping === 0 ? 'text-primary-600 font-semibold' : 'font-medium'}>
              {totals.shipping === 0 ? 'Gratis 🎉' : formatCurrency(totals.shipping)}
            </span>
          </div>
          <div className="h-px bg-primary-200 my-1" />
          <div className="flex justify-between">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-xl text-primary-700">{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-gray-100 border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all';

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

