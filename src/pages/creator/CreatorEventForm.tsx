
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import CreatorLayout from "@/components/creator/CreatorLayout";
import EventForm from "@/components/creator/EventForm";

const CreatorEventForm = () => {
  const { user } = useAuth();
  
  return (
    <CreatorLayout>
      <div className="container py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Manage Event</h1>
        <EventForm isCreator={true} creatorId={user?.id} />
      </div>
    </CreatorLayout>
  );
};

export default CreatorEventForm;
