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
  Select,
  Input,
  Button,
  Card,
  CardContent,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
  useTheme
} from "@/components/dark-ui";
import { 
  Calculator, 
  ArrowRightLeft, 
  Percent, 
  DollarSign, 
  Info
} from "lucide-react";

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
  const { theme } = useTheme();
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
                  <span 
                    className="absolute left-2.5 top-2.5 text-sm"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    R
                  </span>
                  <Input
                    type="number"
                    placeholder="10000"
                    style={{ paddingLeft: '2.25rem' }}
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
              <FormControl>
                <Select
                  value={field.value || ''}
                  onChange={handleSelectOpportunity}
                  placeholder="Select an arbitrage opportunity"
                  options={opportunities.map((opportunity, index) => ({
                    value: `${opportunity.buyExchange.toLowerCase()}-${opportunity.sellExchange.toLowerCase()}`,
                    label: `${opportunity.route} (${formatPercentage(opportunity.spreadPercentage)})`
                  }))}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Select the arbitrage opportunity to calculate potential profit
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedOpportunity && (
          <Card 
            variant="muted"
            style={{
              borderStyle: 'dashed',
              borderColor: theme.colors.border.primary
            }}
          >
            <CardContent style={{ paddingTop: '1rem', paddingBottom: '0.5rem' }}>
              <div className="text-sm flex flex-col space-y-1">
                <div className="flex items-center justify-between">
                  <span style={{ color: theme.colors.text.secondary }}>Current Spread:</span>
                  <span style={{ fontWeight: '500', color: theme.colors.status.success }}>
                    {formatZAR(selectedOpportunity.spread)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: theme.colors.text.secondary }}>Spread Percentage:</span>
                  <span style={{ fontWeight: '500', color: theme.colors.status.success }}>
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
                    <Tooltip 
                      content={
                        <p className="w-60 text-xs">
                          Default: {getBuyExchangeFee()?.tradingFeePercentage || 'N/A'}% for {selectedOpportunity?.buyExchange || 'selected exchange'}
                        </p>
                      }
                    >
                      <Info 
                        className="h-3.5 w-3.5 ml-1 cursor-help" 
                        style={{ color: theme.colors.text.secondary }}
                      />
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Percent 
                      className="absolute left-2.5 top-2.5 h-4 w-4" 
                      style={{ color: theme.colors.text.secondary }}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={getBuyExchangeFee()?.tradingFeePercentage?.toString() || "0.1"}
                      style={{ paddingLeft: '2.25rem' }}
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
                    <Tooltip 
                      content={
                        <p className="w-60 text-xs">
                          Default: {getSellExchangeFee()?.tradingFeePercentage || 'N/A'}% for {selectedOpportunity?.sellExchange || 'selected exchange'}
                        </p>
                      }
                    >
                      <Info 
                        className="h-3.5 w-3.5 ml-1 cursor-help" 
                        style={{ color: theme.colors.text.secondary }}
                      />
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Percent 
                      className="absolute left-2.5 top-2.5 h-4 w-4" 
                      style={{ color: theme.colors.text.secondary }}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={getSellExchangeFee()?.tradingFeePercentage?.toString() || "0.1"}
                      style={{ paddingLeft: '2.25rem' }}
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
                  <Tooltip 
                    content={
                      <p className="w-60 text-xs">
                        The cost of transferring BTC between exchanges or any other transaction fees
                      </p>
                    }
                  >
                    <Info 
                      className="h-3.5 w-3.5 ml-1 cursor-help" 
                      style={{ color: theme.colors.text.secondary }}
                    />
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <span 
                    className="absolute left-2.5 top-2.5 text-sm"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    R
                  </span>
                  <Input
                    type="number"
                    placeholder="100"
                    style={{ paddingLeft: '2.25rem' }}
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
          variant="primary"
          style={{ width: '100%' }}
        >
          <Calculator className="mr-2 h-4 w-4" />
          {isCalculating ? "Calculating..." : "Calculate Profit"}
        </Button>
      </form>
    </Form>
  );
}