"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useToast } from "@/hooks/use-toast"
import { getStorageItem, setStorageItem } from "@/lib/storage-utils"
import { supabase } from "@/lib/supabaseClient"

// Define types for our data
interface Room {
  id: string
  name: string
  created_at?: string
}

interface Item {
  id: string
  room_id: string
  name: string
  quantity: number
  cost_per_unit: number
  created_at?: string
}

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [newRoomName, setNewRoomName] = useState("")
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const { toast } = useToast()

  // Load rooms and items from Supabase on initial render
  useEffect(() => {
    const fetchRoomsAndItems = async () => {
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("*")
        .order("created_at", { ascending: false })
      if (roomsError) {
        toast({
          title: "Error",
          description: roomsError.message,
          variant: "destructive",
        })
        return
      }
      setRooms(roomsData || [])

      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select("*")
      if (itemsError) {
        toast({
          title: "Error",
          description: itemsError.message,
          variant: "destructive",
        })
        return
      }
      setItems(itemsData || [])
    }
    fetchRoomsAndItems()
  }, [])

  // Calculate total value for a room
  const calculateRoomTotal = (roomId: string) => {
    return items
      .filter((item) => item.room_id === roomId)
      .reduce((total, item) => total + item.quantity * item.cost_per_unit, 0)
  }

  // Calculate grand total across all rooms
  const calculateGrandTotal = () => {
    return rooms.reduce((total, room) => total + calculateRoomTotal(room.id), 0)
  }

  // Add a new room to Supabase
  const handleAddRoom = async () => {
    if (!newRoomName.trim()) {
      toast({
        title: "Error",
        description: "Room name cannot be empty",
        variant: "destructive",
      })
      return
    }
    const { data, error } = await supabase
      .from("rooms")
      .insert([{ name: newRoomName.trim() }])
      .select()
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      return
    }
    setRooms((prev) => (data ? [...data, ...prev] : prev))
    setNewRoomName("")
    setIsAddRoomOpen(false)
    toast({
      title: "Room added",
      description: `${newRoomName} has been added successfully`,
    })
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Shop Inventory</h1>
          <p className="text-muted-foreground">Total Shop Value: ${calculateGrandTotal().toFixed(2)}</p>
        </div>

        <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Room</DialogTitle>
              <DialogDescription>Enter a name for the new room to add it to your inventory.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Room Name</Label>
                <Input
                  id="name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Living Room, Kitchen, etc."
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddRoom}>Add Room</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2">No rooms added yet</h2>
          <p className="text-muted-foreground mb-4">Add your first room to get started with your shop inventory</p>
          <Button onClick={() => setIsAddRoomOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Room
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {rooms.map((room) => (
            <Link href={`/room/${room.id}`} key={room.id} className="block">
              <Card className="h-full transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle>{room.name}</CardTitle>
                  <CardDescription>{items.filter((item) => item.room_id === room.id).length} items</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">${calculateRoomTotal(room.id).toFixed(2)}</p>
                  <p className="text-muted-foreground">Total Value</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    View Items
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
      {rooms.length > 0 && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>All shop data is now stored in the cloud and shared across all users.</p>
        </div>
      )}
    </main>
  )
}
