import {UserIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const customerProfileType = defineType({
  name: 'customerProfile',
  title: 'Customer Profiles',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'fullName',
      title: 'Full Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'email',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'clerkUserId',
      title: 'Clerk User ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'loyaltyCardNumber',
      title: 'Loyalty Card Number',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'loyaltyPoints',
      title: 'Loyalty Points',
      type: 'number',
      initialValue: 0,
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'loyaltyTier',
      title: 'Loyalty Tier',
      type: 'string',
      options: {
        list: [
          {title: 'Bronze', value: 'bronze'},
          {title: 'Silver', value: 'silver'},
          {title: 'Gold', value: 'gold'},
        ],
      },
      initialValue: 'bronze',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'installmentsEligible',
      title: 'Eligible For Installments',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'fullName',
      subtitle: 'email',
      tier: 'loyaltyTier',
      points: 'loyaltyPoints',
    },
    prepare({title, subtitle, tier, points}) {
      return {
        title,
        subtitle: `${subtitle} - ${tier || 'bronze'} (${points || 0} pts)`,
      }
    },
  },
})
