import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const findProduct = cart.find(product => product.id === productId)
      const stock = (await api.get(`stock/${productId}`)).data

      if (stock.amount < 1) toast.error('Quantidade solicitada fora de estoque');

      if (findProduct) {
        if(findProduct.amount < stock.amount) {
          const newCart = cart.map(product => {
            if(product.id === productId) return {
              ...product,
              amount: product.amount + 1
            }
            return product
          })
          setCart(newCart)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        const newProduct = (await api.get(`products/${productId}`)).data
        const newCart = [...cart, { ...newProduct, amount: 1 }]
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const hasProduct = cart.find(product => product.id === productId)
      if(!hasProduct) {
        toast.error('Erro na remoção do produto');
      } else {
        const newCart = cart.filter(product => product.id !== productId)
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stock = (await api.get(`stock/${productId}`)).data
      const hasProduct = cart.find(product => product.id === productId)

      if(!hasProduct || amount < 1) {
        toast.error('Erro na alteração de quantidade do produto');
      } else if (stock.amount < amount || amount <= 0) {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        const newCart = cart.map(product => {
          if (product.id === productId) return {
            ...product, amount
          }
          return product
        })
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
