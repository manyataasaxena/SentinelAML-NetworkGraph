import { useState } from "react"
import { Link } from "wouter"
import { useListCustomers, useCreateCustomer, getListCustomersQueryKey, RiskLevel } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Search, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { formatRiskScore } from "@/lib/utils"

const createFormSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  country: z.string().min(1, "Country is required"),
  dob: z.string(),
  accountNo: z.string().min(1, "Account number is required"),
})

function CreateCustomerDialog({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const createCustomer = useCreateCustomer()
  
  const form = useForm<z.infer<typeof createFormSchema>>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      country: "",
      dob: "",
      accountNo: "",
    },
  })

  function onSubmit(values: z.infer<typeof createFormSchema>) {
    createCustomer.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() })
          toast({ title: "Customer created successfully" })
          onOpenChange(false)
          form.reset()
        },
        onError: (err) => {
          toast({ 
            variant: "destructive", 
            title: "Failed to create", 
            description: err.data?.error || "Unknown error" 
          })
        }
      }
    )
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create Customer Profile</DialogTitle>
        <DialogDescription>
          Add a new entity to the monitoring system.
        </DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name / Entity Name</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Corp" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="contact@acme.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input placeholder="ACC-123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country Code</FormLabel>
                  <FormControl>
                    <Input placeholder="US" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth / Inc.</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={createCustomer.isPending}>
              {createCustomer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Profile
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  )
}

export default function Customers() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [riskLevel, setRiskLevel] = useState<RiskLevel | "ALL">("ALL")
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading } = useListCustomers({
    page,
    limit: 20,
    search: search || undefined,
    riskLevel: riskLevel !== "ALL" ? riskLevel : undefined,
  })

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Directory</h1>
          <p className="text-muted-foreground mt-1">Search and filter monitored entities.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Entity
            </Button>
          </DialogTrigger>
          <CreateCustomerDialog onOpenChange={setDialogOpen} />
        </Dialog>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-4 bg-card/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, account, or email..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select 
              value={riskLevel} 
              onValueChange={(val) => {
                setRiskLevel(val as RiskLevel | "ALL")
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Levels</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="critical">Critical Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                <TableRow>
                  <TableHead>Entity</TableHead>
                  <TableHead>Account No</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Risk Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No entities found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        <Link href={`/customers/${customer.id}`} className="hover:underline text-primary">
                          {customer.fullName}
                        </Link>
                        <div className="text-xs text-muted-foreground font-normal">{customer.email}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{customer.accountNo}</TableCell>
                      <TableCell>{customer.country}</TableCell>
                      <TableCell className="text-right font-mono">{formatRiskScore(customer.riskScore)}</TableCell>
                      <TableCell>
                        <Badge variant={customer.riskLevel}>{customer.riskLevel.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
        
        {data && data.total > 0 && (
          <div className="p-4 border-t border-border bg-card/50 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing {((page - 1) * data.limit) + 1} to {Math.min(page * data.limit, data.total)} of {data.total} entries
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => p + 1)}
                disabled={page * data.limit >= data.total}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
