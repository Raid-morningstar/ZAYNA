import {TagIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const promoCodeType = defineType({
  name: 'promoCode',
  title: 'Promo Codes',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Internal Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(2),
    }),
    defineField({
      name: 'code',
      title: 'Code',
      type: 'string',
      description: 'Customer-facing promo code (for example: RAMADAN10)',
      validation: (Rule) => Rule.required().uppercase().min(3).max(30),
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'discountType',
      title: 'Discount Type',
      type: 'string',
      options: {
        list: [
          {title: 'Percentage', value: 'percentage'},
          {title: 'Fixed Amount', value: 'fixed'},
        ],
      },
      validation: (Rule) => Rule.required(),
      initialValue: 'percentage',
    }),
    defineField({
      name: 'discountValue',
      title: 'Discount Value',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'minimumOrderAmount',
      title: 'Minimum Order Amount',
      type: 'number',
      initialValue: 0,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'allowedPaymentMethods',
      title: 'Allowed Payment Methods',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Cash on Delivery', value: 'cod'},
          {title: 'CMI Card', value: 'cmi_card'},
          {title: 'Installments', value: 'installments'},
        ],
      },
      validation: (Rule) => Rule.required().min(1),
      initialValue: ['cod', 'cmi_card', 'installments'],
    }),
    defineField({
      name: 'startsAt',
      title: 'Starts At',
      type: 'datetime',
    }),
    defineField({
      name: 'endsAt',
      title: 'Ends At',
      type: 'datetime',
    }),
    defineField({
      name: 'usageLimit',
      title: 'Usage Limit',
      type: 'number',
      description: 'Leave empty for unlimited usage',
      validation: (Rule) => Rule.min(1),
    }),
    defineField({
      name: 'usedCount',
      title: 'Used Count',
      type: 'number',
      initialValue: 0,
      validation: (Rule) => Rule.min(0),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'code',
      active: 'active',
    },
    prepare({title, subtitle, active}) {
      return {
        title,
        subtitle: `${subtitle} ${active ? '(Active)' : '(Inactive)'}`,
      }
    },
  },
})
