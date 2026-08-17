'use client'
import { useState } from 'react'

// ============================================
// EDIT THESE — your real FAQ questions and answers.
// Add, remove, or reorder entries freely.
// ============================================
const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: 'How do I place an order?',
    answer:
      'Browse the catalog, add items to your cart, then click Checkout. Your order details will be sent to us via WhatsApp, and we\'ll follow up to confirm payment and delivery.',
  },
  {
    question: 'What file types are available for each design?',
    answer:
      'Available file types vary by product and are shown on each product\'s detail view (e.g. 3DM, STL, JCD, MGX).',
  },
  {
    question: 'How do I pay?',
    answer:
      'Payment is handled manually after checkout — we\'ll confirm payment details with you directly over WhatsApp.',
  },
  {
    question: 'Can I request a custom design?',
    answer:
      'Yes — reach out via the Contact Us section and let us know what you\'re looking for.',
  },
]

export default function FAQModal({ onClose }: { onClose: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-xl w-full max-h-[85vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Frequently Asked Questions
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="space-y-2">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <div key={index} className="border border-gray-200 rounded-md">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex justify-between items-center text-left px-4 py-3 text-sm font-medium text-gray-900"
                >
                  {item.question}
                  <span className="text-gray-400 ml-2">{isOpen ? '▾' : '▸'}</span>
                </button>
                {isOpen && (
                  <p className="px-4 pb-3 text-sm text-gray-600">{item.answer}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
