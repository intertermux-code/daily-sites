import { useCart } from '../context/CartContext';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, totalPrice } = useCart();

  return (
    <>
      <div
        className="cart-overlay"
        data-open={isOpen}
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        className="cart-drawer"
        data-open={isOpen}
        role="dialog"
        aria-label="Shopping cart"
        aria-hidden={!isOpen}
      >
        <div className="cart-drawer-header">
          <h2>Your Cart</h2>
          <button
            className="cart-drawer-close"
            onClick={closeCart}
            aria-label="Close cart"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="cart-items">
          {items.length === 0 ? (
            <div className="cart-empty">
              <p>Your cart is empty.</p>
              <button className="btn btn--sage" onClick={closeCart}>
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map(item => (
              <div className="cart-item" key={item.id}>
                <img
                  className="cart-item-img"
                  src={item.image}
                  alt={item.name}
                  width={64}
                  height={64}
                />
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  <p>${item.price} × {item.quantity}</p>
                </div>
                <button
                  className="cart-item-remove"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.name} from cart`}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span className="cart-total-label">Subtotal</span>
              <span className="cart-total-amount">${totalPrice.toFixed(2)}</span>
            </div>
            <button className="btn btn--primary btn--full">
              Checkout — ${totalPrice.toFixed(2)}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}