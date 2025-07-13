"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getStorageItem, setStorageItem } from "@/lib/storage-utils"
import { supabase } from "@/lib/supabaseClient"

// Define types for our data
interface Room {
  id: string
  name: string
}

interface Item {
  id: string
  room_id: string
  name: string
  quantity: number
  cost_per_unit: number
  created_at?: string
}

interface ItemFormData {
  name: string
  quantity: number
  costPerUnit: number
}

function isPromise<T>(value: any): value is Promise<T> {
  return typeof value === 'object' && value !== null && typeof value.then === 'function';
}

export default function RoomPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  // Unwrap params if it's a promise (for future Next.js compatibility)
  const actualParams = isPromise<{ id: string }>(params) ? use(params) : params;
  const router = useRouter()
  const { toast } = useToast()
  const [room, setRoom] = useState<Room | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false)
  const [isDeleteRoomOpen, setIsDeleteRoomOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [isDeleteItemOpen, setIsDeleteItemOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [roomName, setRoomName] = useState("")
  const [itemFormData, setItemFormData] = useState<ItemFormData>({
    name: "",
    quantity: 1,
    costPerUnit: 0,
  })

  // Load room from localStorage and items from Supabase on initial render
  useEffect(() => {
    // Fetch room from Supabase
    const fetchRoom = async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", actualParams.id)
        .single();

      if (error || !data) {
        router.push("/");
        return;
      }
      setRoom(data);
      setRoomName(data.name);
    };

    fetchRoom();

    // Fetch items from Supabase
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("room_id", actualParams.id)
        .order("created_at", { ascending: false });
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      setItems(data || []);
    };
    fetchItems();
  }, [actualParams.id, router, toast]);

  // Calculate total value for the room
  const calculateRoomTotal = () => {
    return items.reduce((total, item) => total + item.quantity * item.cost_per_unit, 0)
  }

  // Add or update an item in Supabase
  const handleAddItem = async () => {
    if (!itemFormData.name.trim()) {
      toast({
        title: "Error",
        description: "Item name cannot be empty",
        variant: "destructive",
      });
      return;
    }
    if (itemFormData.quantity <= 0) {
      toast({
        title: "Error",
        description: "Quantity must be greater than zero",
        variant: "destructive",
      });
      return;
    }
    if (!room) {
      toast({
        title: "Error",
        description: "Room not loaded",
        variant: "destructive",
      });
      return;
    }
    if (editingItem) {
      // Update existing item
      const { data, error } = await supabase
        .from("items")
        .update({
          name: itemFormData.name.trim(),
          quantity: itemFormData.quantity,
          cost_per_unit: itemFormData.costPerUnit,
        })
        .eq("id", editingItem.id)
        .select()
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        return
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? { ...item, name: itemFormData.name.trim(), quantity: itemFormData.quantity, cost_per_unit: itemFormData.costPerUnit }
            : item
        )
      )
      toast({
        title: "Item updated",
        description: `${itemFormData.name} has been updated successfully`,
      })
    } else {
      // Add new item
      console.log("Adding item:", {
        room_id: room.id,
        name: itemFormData.name.trim(),
        quantity: itemFormData.quantity,
        cost_per_unit: itemFormData.costPerUnit,
      });
      const { data, error } = await supabase
        .from("items")
        .insert([
          {
            room_id: room.id, // use room.id here!
            name: itemFormData.name.trim(),
            quantity: itemFormData.quantity,
            cost_per_unit: itemFormData.costPerUnit,
          },
        ])
        .select();
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      // Refetch items after insert
      const { data: newItems } = await supabase
        .from("items")
        .select("*")
        .eq("room_id", room.id)
        .order("created_at", { ascending: false });
      setItems(newItems || []);
      toast({
        title: "Item added",
        description: `${itemFormData.name} has been added successfully`,
      });
    }
    setItemFormData({ name: "", quantity: 1, costPerUnit: 0 });
    setIsAddItemOpen(false);
    setEditingItem(null);
  };

  // Edit an item
  const handleEditItem = (item: Item) => {
    setEditingItem(item)
    setItemFormData({
      name: item.name,
      quantity: item.quantity,
      costPerUnit: item.cost_per_unit,
    })
    setIsAddItemOpen(true)
  }

  // Delete an item from Supabase
  const handleDeleteItem = async () => {
    if (!itemToDelete) return
    const { error } = await supabase
      .from("items")
      .delete()
      .eq("id", itemToDelete)
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      return
    }
    setItems((prev) => prev.filter((item) => item.id !== itemToDelete))
    setIsDeleteItemOpen(false)
    setItemToDelete(null)
    toast({
      title: "Item deleted",
      description: `Item has been removed from your inventory`,
    })
  }

  // Update room name
  const handleUpdateRoom = async () => {
    if (!roomName.trim()) {
      toast({
        title: "Error",
        description: "Room name cannot be empty",
        variant: "destructive",
      })
      return
    }

    const { error } = await supabase
      .from("rooms")
      .update({ name: roomName.trim() })
      .eq("id", room?.id)

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    if (room) {
      setRoom({ ...room, name: roomName.trim(), id: room.id })
    }
    setIsEditRoomOpen(false)

    toast({
      title: "Room updated",
      description: `Room name changed to ${roomName}`,
    })
  }

  // Delete room and all its items
  const handleDeleteRoom = async () => {
    if (!room) return

    // Delete room
    const { error: roomError } = await supabase
      .from("rooms")
      .delete()
      .eq("id", room.id)

    if (roomError) {
      toast({
        title: "Error",
        description: roomError.message,
        variant: "destructive",
      })
      return
    }

    // Delete all items in the room
    const { error: itemsError } = await supabase
      .from("items")
      .delete()
      .eq("room_id", room.id)

    if (itemsError) {
      toast({
        title: "Error",
        description: itemsError.message,
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Room deleted",
      description: `${room.name} and all its items have been removed`,
    })

    router.push("/")
  }

  if (!room) {
    return <div className="container mx-auto py-8 px-4">Loading...</div>
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to home</span>
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">{room.name}</h1>
            <Button variant="ghost" size="icon" onClick={() => setIsEditRoomOpen(true)}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit room</span>
            </Button>
          </div>
          <p className="text-muted-foreground">
            {items.length} items · Total Value: ${calculateRoomTotal().toFixed(2)}
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog
            open={isAddItemOpen}
            onOpenChange={(open) => {
              setIsAddItemOpen(open)
              if (!open) {
                setEditingItem(null)
                setItemFormData({ name: "", quantity: 1, costPerUnit: 0 })
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? "Update the details of this item in your inventory."
                    : "Enter the details of the item to add it to your inventory."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="item-name">Item Name</Label>
                  <Input
                    id="item-name"
                    value={itemFormData.name}
                    onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                    placeholder="TV, Sofa, Lamp, etc."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={itemFormData.quantity}
                    onChange={(e) =>
                      setItemFormData({ ...itemFormData, quantity: Number.parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cost">Cost Per Unit ($)</Label>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemFormData.costPerUnit}
                    onChange={(e) =>
                      setItemFormData({ ...itemFormData, costPerUnit: Number.parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddItem}>{editingItem ? "Update Item" : "Add Item"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={() => setIsDeleteRoomOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Room
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <h2 className="text-xl font-medium">No items in this room yet</h2>
            <p className="text-muted-foreground">Add your first item to start tracking your shop inventory</p>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button onClick={() => setIsAddItemOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Cost Per Unit</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">${item.cost_per_unit.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${(item.quantity * item.cost_per_unit).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditItem(item)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit {item.name}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setItemToDelete(item.id)
                            setIsDeleteItemOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete {item.name}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-bold">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold">${calculateRoomTotal().toFixed(2)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Edit Room Dialog */}
      <Dialog open={isEditRoomOpen} onOpenChange={setIsEditRoomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>Update the name of this room.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="room-name">Room Name</Label>
              <Input id="room-name" value={roomName} onChange={(e) => setRoomName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateRoom}>Update Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Room Alert Dialog */}
      <AlertDialog open={isDeleteRoomOpen} onOpenChange={setIsDeleteRoomOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the room "{room.name}" and all {items.length} items inside it. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoom}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Item Alert Dialog */}
      <AlertDialog open={isDeleteItemOpen} onOpenChange={setIsDeleteItemOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>All items are now stored in the cloud and shared across all users.</p>
      </div>
    </main>
  )
}
