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

// Define types for our data
interface Room {
  id: string
  name: string
}

interface Item {
  id: string
  roomId: string
  name: string
  quantity: number
  costPerUnit: number
}

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [newRoomName, setNewRoomName] = useState("")
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const { toast } = useToast()

  // Load data from localStorage on initial render
  useEffect(() => {
    const savedRooms = getStorageItem<Room[]>("rooms", [])
    const savedItems = getStorageItem<Item[]>("items", [])

    setRooms(savedRooms)
    setItems(savedItems)
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    setStorageItem("rooms", rooms)
  }, [rooms])

  useEffect(() => {
    setStorageItem("items", items)
  }, [items])

  // Calculate total value for a room
  const calculateRoomTotal = (roomId: string) => {
    return items
      .filter((item) => item.roomId === roomId)
      .reduce((total, item) => total + item.quantity * item.costPerUnit, 0)
  }

  // Calculate grand total across all rooms
  const calculateGrandTotal = () => {
    return rooms.reduce((total, room) => total + calculateRoomTotal(room.id), 0)
  }

  // Add a new room
  const handleAddRoom = () => {
    if (!newRoomName.trim()) {
      toast({
        title: "Error",
        description: "Room name cannot be empty",
        variant: "destructive",
      })
      return
    }

    const newRoom: Room = {
      id: Date.now().toString(),
      name: newRoomName.trim(),
    }

    setRooms([...rooms, newRoom])
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
                  <CardDescription>{items.filter((item) => item.roomId === room.id).length} items</CardDescription>
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
          <p>All shop data is stored locally on your device and will be available when you return.</p>
        </div>
      )}
    </main>
  )
}
