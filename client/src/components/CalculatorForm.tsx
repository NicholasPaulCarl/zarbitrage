import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArbitrageOpportunity, CalculatorInput, CalculatorResult, ExchangeFee } from "@/lib/types";
import { formatZAR, formatPercentage } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calculator, 
  ArrowRightLeft, 
  Percent, 
  DollarSign, 
  Info
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CalculatorFormProps {
  opportunities: ArbitrageOpportunity[];
  exchangeFees: ExchangeFee[];
  onCalculate: (result: CalculatorResult) => void;
}

const calculatorSchema = z.object({
  opportunityId: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be positive"),
  customBuyFee: z.coerce.number().min(0, "Fee cannot be negative").optional(),
  customSellFee: z.coerce.number().min(0, "Fee cannot be negative").optional(),
  transferFee: z.coerce.number().min(0, "Fee cannot be negative").optional(),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

export function CalculatorForm({ opportunities, exchangeFees, onCalculate }: CalculatorFormProps) {
  const { toast } = useToast();
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<ArbitrageOpportunity | null>(null);

  // Default values
  const defaultValues: Partial<CalculatorFormValues> = {
    amount: 10000,
    customBuyFee: undefined,
    customSellFee: undefined,
    transferFee: 100,
  };

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues,
  });

  const handleSelectOpportunity = (value: string) => {
    const [buyExchange, sellExchange] = value.split('-');
    const opportunity = opportunities.find(
      opp => opp.buyExchange.toLowerCase() === buyExchange && 
            opp.sellExchange.toLowerCase() === sellExchange
    );

    setSelectedOpportunity(opportunity || null);
    form.setValue("opportunityId", value);
  };

  const getBuyExchangeFee = () => {
    if (!selectedOpportunity) return null;
    return exchangeFees.find(fee => fee.name === selectedOpportunity.buyExchange);
  };

  const getSellExchangeFee = () => {
    if (!selectedOpportunity) return null;
    return exchangeFees.find(fee => fee.name === selectedOpportunity.sellExchange);
  };

  async function onSubmit(values: CalculatorFormValues) {
    try {
      setIsCalculating(true);

      // Make sure we have a selected opportunity
      if (!selectedOpportunity || !values.opportunityId) {
        throw new Error("Please select an arbitrage opportunity first");
      }

      const calculatorInput: CalculatorInput = {
        opportunityId: values.opportunityId,
        amount: values.amount,
        customBuyFee: values.customBuyFee,
        customSellFee: values.customSellFee,
        transferFee: values.transferFee,
      };

      console.log("Submitting calculator input:", calculatorInput);

      // Make the API request
      try {
        const result = await apiRequest<CalculatorResult>(
          "/api/calculator", 
          { 
            method: "POST",
            body: JSON.stringify(calculatorInput)
          }
        );
        console.log("Received calculation result:", result);
        onCalculate(result);
      } catch (err) {
        console.error("API request failed:", err);
        throw new Error("Failed to calculate profit. Please try again.");
      }
    } catch (error) {
      console.error("Error calculating profit:", error);
      toast({
        variant: "destructive",
        title: "Calculation failed",
        description: error instanceof Error 
          ? error.message 
          : "There was an error calculating the profit. Please try again."
      });
    } finally {
      setIsCalculating(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Investment Amount */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                Investment Amount (ZAR)
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-sm text-gray-500">R</span>
                  <Input
                    type="number"
                    placeholder="10000"
                    className="pl-9"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormDescription className="text-xs">
                Enter the amount in ZAR you want to invest
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Arbitrage Opportunity Selection */}
        <FormField
          control={form.control}
          name="opportunityId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Arbitrage Opportunity</FormLabel>
              <Select
                onValueChange={handleSelectOpportunity}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an arbitrage opportunity" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {opportunities.map((opportunity, index) => (
                    <SelectItem
                      key={`${opportunity.buyExchange.toLowerCase()}-${opportunity.sellExchange.toLowerCase()}`}
                      value={`${opportunity.buyExchange.toLowerCase()}-${opportunity.sellExchange.toLowerCase()}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{opportunity.route}</span>
                        <span className="ml-2 text-green-600 font-medium">
                          {formatPercentage(opportunity.spreadPercentage)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription className="text-xs">
                Select the arbitrage opportunity to calculate potential profit
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedOpportunity && (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="pt-4 pb-2">
              <div className="text-sm flex flex-col space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Current Spread:</span>
                  <span className="font-medium text-green-600">
                    {formatZAR(selectedOpportunity.spread)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Spread Percentage:</span>
                  <span className="font-medium text-green-600">
                    {formatPercentage(selectedOpportunity.spreadPercentage)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Custom Buy Fee */}
          <FormField
            control={form.control}
            name="customBuyFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  Buy Exchange Fee (%)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-60 text-xs">
                          Default: {getBuyExchangeFee()?.tradingFeePercentage || 'N/A'}% for {selectedOpportunity?.buyExchange || 'selected exchange'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={getBuyExchangeFee()?.tradingFeePercentage?.toString() || "0.1"}
                      className="pl-9"
                      {...field}
                      value={field.value === undefined ? '' : field.value}
                      onChange={(e) => {
                        if (e.target.value === '') {
                          field.onChange(undefined);
                        } else {
                          field.onChange(e);
                        }
                      }}
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-xs">
                  Optional: override default fee
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Custom Sell Fee */}
          <FormField
            control={form.control}
            name="customSellFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  Sell Exchange Fee (%)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-60 text-xs">
                          Default: {getSellExchangeFee()?.tradingFeePercentage || 'N/A'}% for {selectedOpportunity?.sellExchange || 'selected exchange'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={getSellExchangeFee()?.tradingFeePercentage?.toString() || "0.1"}
                      className="pl-9"
                      {...field}
                      value={field.value === undefined ? '' : field.value}
                      onChange={(e) => {
                        if (e.target.value === '') {
                          field.onChange(undefined);
                        } else {
                          field.onChange(e);
                        }
                      }}
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-xs">
                  Optional: override default fee
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Transfer Fee */}
        <FormField
          control={form.control}
          name="transferFee"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                Transfer Fee (ZAR)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-60 text-xs">
                        The cost of transferring BTC between exchanges or any other transaction fees
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-sm text-gray-500">R</span>
                  <Input
                    type="number"
                    placeholder="100"
                    className="pl-9"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormDescription className="text-xs">
                Network fees, withdrawal fees, and other costs
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isCalculating || !form.getValues("opportunityId")}
          className="w-full"
        >
          <Calculator className="mr-2 h-4 w-4" />
          {isCalculating ? "Calculating..." : "Calculate Profit"}
        </Button>
      </form>
    </Form>
  );
}