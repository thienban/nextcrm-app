"use client";

import type { DragEndEvent } from '@/components/ui/shadcn-io/kanban';
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanProvider
} from '@/components/ui/shadcn-io/kanban';
import { format } from "date-fns";
import { CalendarCheck, CalendarDays, ClipboardList, CoinsIcon, Combine, DollarSign, SquareStack, ThumbsDown, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  crm_Opportunities,
  crm_Opportunities_Sales_Stages,
} from "@prisma/client";

import { DotsHorizontalIcon, PlusCircledIcon } from "@radix-ui/react-icons";

import LoadingModal from "@/components/modals/loading-modal";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

import { setInactiveOpportunity } from "@/actions/crm/opportunity/dashboard/set-inactive";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import axios from 'axios';
import { NewOpportunityForm } from "../../opportunities/components/NewOpportunityForm";
import { Button } from '@/components/ui/button';
import moment from 'moment';

interface CRMKanbanProps {
  salesStages: crm_Opportunities_Sales_Stages[];
  opportunities: crm_Opportunities[];
  crmData: any;
}

const CRMKanban = ({
  salesStages,
  opportunities: data,
  crmData,
}: CRMKanbanProps) => {
  const router = useRouter();

  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [selectedStage, setSelectedStage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [opportunities, setOpportunities] = useState(data);

  const { users, accounts, contacts, saleTypes, saleStages, campaigns } =
    crmData;

  useEffect(() => {
    setOpportunities(data);
    setIsLoading(false);
  }, [data]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onDragEnd = async (event: DragEndEvent) => {
    //TODO: Add optimistic ui

    const { active, over } = event;

    if (!over) {
      return;
    }

    const stage = salesStages.find((stage) => stage.id === over.id);

    if (!stage) {
      return;
    }

    if (active?.data?.current?.parent !== over.id) {
      setIsLoading(true);
      try {
        const response = await axios.put(`/api/crm/opportunity/${active.id}`, {
          source: active?.data?.current?.parent,
          destination: stage.id,
        });
        setOpportunities(response.data.data);
        toast({
          title: "Success",
          description: "Opportunity sale stage changed",
        });
      } catch (error) {
        console.log(error);
        toast({
          title: "Error",
          description: "Something went wrong",
        });
      } finally {
        router.refresh();
        setIsLoading(false);
      }
    }
    // If start is the same as end, we're in the same column
  };

  const onThumbsUp = async (opportunity: crm_Opportunities) => {
    // Implement thumbs up logic
    alert("Thumbs up - not implemented yet");
  };

  const onThumbsDown = async (opportunity: string) => {
    // Implement thumbs down logic
    console.log(opportunity, "opportunity");
    try {
      await setInactiveOpportunity(opportunity);
      toast({
        title: "Success",
        description: "Opportunity has been set to inactive",
      });
    } catch (error) {
      console.log(error);
    } finally {
      router.refresh();
    }

    //alert("Thumbs down - not implemented yet");
  };

  // console.log(opportunities, "opportunities");

  return (
    <>
      <LoadingModal
        title="Reordering opportunities"
        description="Please wait while we reorder the opportunities"
        isOpen={isLoading}
      />
      {/* Dialog */}

      <Dialog open={isDialogOpen} onOpenChange={() => setIsDialogOpen(false)}>
        <DialogContent className="min-w-fit py-10 overflow-auto h-5/6">
          <NewOpportunityForm
            users={users}
            accounts={accounts}
            contacts={contacts}
            salesType={saleTypes}
            saleStages={saleStages}
            campaigns={campaigns}
            selectedStage={selectedStage}
            onDialogClose={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <KanbanProvider onDragEnd={onDragEnd} className="p-4">
        {salesStages.map((stage: any) => (
          <KanbanBoard id={stage.id} key={stage.id}>
            <CardTitle className="flex gap-2 p-3 justify-between">
              <span className="text-sm font-bold">{stage.name}</span>
              <PlusCircledIcon
                className="w-5 h-5 cursor-pointer"
                onClick={() => {
                  setSelectedStage(stage.id);
                  setIsDialogOpen(true);
                }}
              />
            </CardTitle>
            <KanbanCards className="w-[15vw]">
              {opportunities
                .filter((opportunity) =>
                  opportunity.sales_stage === stage.id &&
                  opportunity.status === "ACTIVE")
                .map((opportunity: any, index: number) => (
                  <KanbanCard
                    id={opportunity.id}
                    index={index}
                    key={opportunity.id}
                    name={opportunity.name}
                    parent={stage.id}>
                    <CardHeader className="flex justify-between">
                      <CardTitle className="text-base font-medium leading-none"
                        onClick={() =>
                          router.push(
                            `/crm/opportunities/${opportunity.id}`
                          )
                        }>
                        {opportunity.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-1">
                      <div>
                        <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                          <CoinsIcon className="mt-px h-5 w-5" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">
                              Opportunity amount
                            </p>
                            <p className="text-sm text-muted-foreground">{opportunity.budget}</p>
                          </div>
                        </div>
                        <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                          <CalendarDays className="mt-px h-5 w-5" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">
                              Expected close date
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {moment(opportunity.close_date).format("MMM DD YYYY")}
                            </p>
                          </div>
                        </div>
                        <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                          <ClipboardList className="mt-px h-5 w-5" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">Description</p>
                            <p className="text-sm text-muted-foreground">
                              {opportunity.description.substring(
                                0,
                                200
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="flex text-xs items-center gap-2">
                        {/*         <pre>
                                      {JSON.stringify(opportunity, null, 2)}
                                    </pre> */}
                        <Avatar className="w-6 h-6">
                          <AvatarImage
                            src={
                              opportunity.assigned_to_user.avatar
                                ? opportunity.assigned_to_user.avatar
                                : `${process.env.NEXT_PUBLIC_APP_URL}/images/nouser.png`
                            }
                          />
                        </Avatar>
                        <span className="text-xs ">
                          {opportunity.assigned_to_user.name}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        {/*                            {
                                      //Hide thumbs up and down for last sales stage
                                      stage.probability !==
                                        Math.max(
                                          ...salesStages.map(
                                            (s) => s.probability || 0
                                          )
                                        ) && (
                                        <ThumbsUp
                                          className="w-4 h-4 text-green-500"
                                          onClick={() =>
                                            onThumbsUp(opportunity.id)
                                          }
                                        />
                                      )
                                    } */}
                        {stage.probability !==
                          Math.max(
                            ...salesStages.map(
                              (s) => s.probability || 0
                            )
                          ) && (
                            <ThumbsDown
                              className="w-4 h-4 text-red-500"
                              onClick={() =>
                                onThumbsDown(opportunity.id)
                              }
                            />
                          )}
                      </div>
                    </CardFooter>
                  </KanbanCard>
                ))}
            </KanbanCards>
          </KanbanBoard>
        ))}
        <Card className="mx-1 w-full min-w-[300px] overflow-hidden pb-10">
          <CardTitle className="flex gap-2 p-3 justify-between">
            <span className="text-sm font-bold">Lost</span>
          </CardTitle>
          <CardContent className="w-full h-full overflow-y-scroll space-y-2">
            {opportunities
              .filter((opportunity: any) => opportunity.status === "INACTIVE")
              .map((opportunity: any, index: number) => (
                <Card key={index}>
                  <CardTitle className="p-2 text-sm">
                    <span className="font-bold">{opportunity?.name}</span>
                  </CardTitle>
                  <CardContent className="text-xs text-muted-foreground">
                    <div className="flex flex-col space-y-1">
                      <div>{opportunity.description.substring(0, 200)}</div>
                      {/*          <div>
                                  id:
                                  {opportunity.id}
                                </div> */}
                      <div className="space-x-1">
                        <span>Amount:</span>
                        <span>{opportunity.budget}</span>
                      </div>
                      <div className="space-x-1">
                        <span>Expected closing:</span>
                        <span
                          className={
                            opportunity.close_date &&
                              new Date(opportunity.close_date) < new Date()
                              ? "text-red-500"
                              : ""
                          }
                        >
                          {format(
                            opportunity.close_date
                              ? new Date(opportunity.close_date)
                              : new Date(),
                            "dd/MM/yyyy"
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </CardContent>
        </Card>
      </KanbanProvider>
    </>
  );
};

export default CRMKanban;
