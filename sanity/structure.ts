import type {StructureResolver} from 'sanity/structure'
import {HomeIcon, BasketIcon, TrolleyIcon, UserIcon} from '@sanity/icons'
import StudioDashboard from './components/StudioDashboard'
import StudioOrdersBoard from './components/StudioOrdersBoard'
import StudioProductsBoard from './components/StudioProductsBoard'
import StudioCustomersBoard from './components/StudioCustomersBoard'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  (() => {
    const hiddenTypes = new Set(['order', 'product', 'customerProfile'])
    const defaultItems = S.documentTypeListItems().filter(
      (listItem) => !hiddenTypes.has(listItem.getId() || '')
    )

    return S.list()
      .title('Content')
      .items([
        S.listItem()
          .title('Dashboard')
          .icon(HomeIcon)
          .child(
            S.component().id('admin-dashboard').title('Admin Dashboard').component(StudioDashboard)
          ),
        S.divider(),
        S.listItem()
          .title('Orders')
          .icon(BasketIcon)
          .child(
            S.list()
              .title('Orders')
              .items([
                S.listItem()
                  .title('Orders Hub')
                  .child(
                    S.component()
                      .id('orders-hub')
                      .title('Orders Hub')
                      .component(StudioOrdersBoard)
                  ),
                S.divider(),
                S.listItem()
                  .title('Pending Orders')
                  .child(
                    S.documentList()
                      .title('Pending Orders')
                      .schemaType('order')
                      .filter('_type == "order" && status == "pending"')
                      .defaultOrdering([{field: 'orderDate', direction: 'desc'}])
                  ),
                S.listItem()
                  .title('Processing Orders')
                  .child(
                    S.documentList()
                      .title('Processing Orders')
                      .schemaType('order')
                      .filter('_type == "order" && status == "processing"')
                      .defaultOrdering([{field: 'orderDate', direction: 'desc'}])
                  ),
                S.listItem()
                  .title('Shipped / Delivery')
                  .child(
                    S.documentList()
                      .title('Shipped / Delivery')
                      .schemaType('order')
                      .filter('_type == "order" && status in ["shipped", "out_for_delivery"]')
                      .defaultOrdering([{field: 'orderDate', direction: 'desc'}])
                  ),
                S.listItem()
                  .title('Delivered Orders')
                  .child(
                    S.documentList()
                      .title('Delivered Orders')
                      .schemaType('order')
                      .filter('_type == "order" && status == "delivered"')
                      .defaultOrdering([{field: 'orderDate', direction: 'desc'}])
                  ),
                S.listItem()
                  .title('All Orders')
                  .child(
                    S.documentTypeList('order')
                      .title('All Orders')
                      .defaultOrdering([{field: 'orderDate', direction: 'desc'}])
                  ),
              ])
          ),
        S.listItem()
          .title('Products')
          .icon(TrolleyIcon)
          .child(
            S.list()
              .title('Products')
              .items([
                S.listItem()
                  .title('Products Hub')
                  .child(
                    S.component()
                      .id('products-hub')
                      .title('Products Hub')
                      .component(StudioProductsBoard)
                  ),
                S.divider(),
                S.listItem()
                  .title('All Products')
                  .child(
                    S.documentTypeList('product')
                      .title('All Products')
                      .defaultOrdering([{field: '_updatedAt', direction: 'desc'}])
                  ),
                S.listItem()
                  .title('Featured Products')
                  .child(
                    S.documentList()
                      .title('Featured Products')
                      .schemaType('product')
                      .filter('_type == "product" && isFeatured == true')
                      .defaultOrdering([{field: '_updatedAt', direction: 'desc'}])
                  ),
                S.listItem()
                  .title('Low Stock Products')
                  .child(
                    S.documentList()
                      .title('Low Stock Products')
                      .schemaType('product')
                      .filter('_type == "product" && stock <= 5')
                      .defaultOrdering([{field: 'stock', direction: 'asc'}])
                  ),
              ])
          ),
        S.listItem()
          .title('Customers')
          .icon(UserIcon)
          .child(
            S.list()
              .title('Customers')
              .items([
                S.listItem()
                  .title('Customers Hub')
                  .child(
                    S.component()
                      .id('customers-hub')
                      .title('Customers Hub')
                      .component(StudioCustomersBoard)
                  ),
                S.divider(),
                S.listItem()
                  .title('All Customer Profiles')
                  .child(
                    S.documentTypeList('customerProfile')
                      .title('All Customer Profiles')
                      .defaultOrdering([{field: '_updatedAt', direction: 'desc'}])
                  ),
                S.listItem()
                  .title('VIP Customers')
                  .child(
                    S.documentList()
                      .title('VIP Customers')
                      .schemaType('customerProfile')
                      .filter('_type == "customerProfile" && loyaltyTier == "gold"')
                      .defaultOrdering([{field: 'loyaltyPoints', direction: 'desc'}])
                  ),
              ])
          ),
        S.divider(),
        ...defaultItems,
      ])
  })()
