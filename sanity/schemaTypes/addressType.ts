import { HomeIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const addressType = defineType({
  name: "address",
  title: "Addresses",
  type: "document",
  icon: HomeIcon,
  fields: [
    defineField({
      name: "name",
      title: "Address Name",
      type: "string",
      description: "A friendly name for this address (e.g. Home, Work)",
      validation: (Rule) => Rule.required().max(50),
    }),
    defineField({
      name: "email",
      title: "User Email",
      type: "email",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "clerkUserId",
      title: "Clerk User ID",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "address",
      title: "Street Address",
      type: "string",
      description: "The street address including apartment/unit number",
      validation: (Rule) => Rule.required().min(5).max(100),
    }),
    defineField({
      name: "city",
      title: "City",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "phone",
      title: "Phone Number",
      type: "string",
      validation: (Rule) =>
        Rule.required().regex(/^[0-9+() -]{8,20}$/, {
          name: "phone",
          invert: false,
        }),
    }),
    defineField({
      name: "state",
      title: "State",
      type: "string",
      description: "State/Region/Province",
      validation: (Rule) => Rule.required().min(2).max(50),
    }),
    defineField({
      name: "zip",
      title: "Postal Code",
      type: "string",
      description: "Example: 12345, 10000-1234, 75001",
      validation: (Rule) =>
        Rule.required()
          .regex(/^[A-Za-z0-9 -]{3,12}$/, {
            name: "postalCode",
            invert: false,
          })
          .custom((postalCode: string | undefined) => {
            if (!postalCode) {
              return "Postal code is required";
            }
            if (!postalCode.match(/^[A-Za-z0-9 -]{3,12}$/)) {
              return "Please enter a valid postal code";
            }
            return true;
          }),
    }),
    defineField({
      name: "default",
      title: "Default Address",
      type: "boolean",
      description: "Is this the default shipping address?",
      initialValue: false,
    }),

    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "address",
      city: "city",
      state: "state",
      isDefault: "default",
    },
    prepare({ title, subtitle, city, state, isDefault }) {
      return {
        title: `${title} ${isDefault ? "(Default)" : ""}`,
        subtitle: `${subtitle}, ${city}, ${state}`,
      };
    },
  },
});
