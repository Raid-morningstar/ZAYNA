import Container from "@/components/Container";
import OrderStatusAutoRefresh from "@/components/OrderStatusAutoRefresh";
import OrdersComponent from "@/components/OrdersComponent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMyOrders } from "@/sanity/queries";
import { auth } from "@clerk/nextjs/server";
import { FileX } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

export const dynamic = "force-dynamic";

const OrdersPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    return redirect("/");
  }

  const orders = await getMyOrders(userId);

  return (
    <div>
      <OrderStatusAutoRefresh />
      <Container className="py-10">
        {orders?.length ? (
          <Card className="w-full border border-shop_light_green/20 shadow-sm">
            <CardHeader className="border-b border-shop_light_green/15">
              <CardTitle className="text-xl text-shop_dark_green">
                Liste des commandes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea>
                <Table>
                  <TableHeader className="bg-shop_light_green/5">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-25 md:w-auto text-[11px] uppercase tracking-wide text-shop_dark_green/80">
                        Numero de commande
                      </TableHead>
                      <TableHead className="hidden md:table-cell text-[11px] uppercase tracking-wide text-shop_dark_green/80">
                        Date
                      </TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wide text-shop_dark_green/80">
                        Client
                      </TableHead>
                      <TableHead className="hidden sm:table-cell text-[11px] uppercase tracking-wide text-shop_dark_green/80">
                        Email
                      </TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wide text-shop_dark_green/80">
                        Total
                      </TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wide text-shop_dark_green/80">
                        Statut
                      </TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wide text-shop_dark_green/80">
                        Paiement
                      </TableHead>
                      <TableHead className="hidden sm:table-cell text-[11px] uppercase tracking-wide text-shop_dark_green/80">
                        Numero de facture
                      </TableHead>
                      <TableHead className="text-center text-[11px] uppercase tracking-wide text-shop_dark_green/80">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <OrdersComponent orders={orders} />
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <FileX className="h-24 w-24 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900">
              Aucune commande trouvee
            </h2>
            <p className="mt-2 text-sm text-gray-600 text-center max-w-md">
              Vous n&apos;avez pas encore passe de commande. Commencez vos
              achats pour voir vos commandes ici !
            </p>
            <Button asChild className="mt-6">
              <Link href="/">Parcourir les produits</Link>
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
};

export default OrdersPage;
