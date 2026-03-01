import type {StructureResolver} from 'sanity/structure'
import {HomeIcon, BasketIcon} from '@sanity/icons'
import StudioDashboard from './components/StudioDashboard'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  (() => {
    const hiddenTypes = new Set(['order'])
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
                  .title('Pending Orders')
                  .child(
                    S.documentList()
                      .title('Pending Orders')
                      .schemaType('order')
                      .filter('_type == "order" && status == "pending"')
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
        S.divider(),
        ...defaultItems,
      ])
  })()
