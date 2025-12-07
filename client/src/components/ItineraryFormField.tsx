import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/translations";

interface ItineraryFormFieldProps {
  name: string; // field name for the form context
}

export function ItineraryFormField({ name }: ItineraryFormFieldProps) {
  const { control, register, formState } = useFormContext();
  const { t } = useTranslation();
  
  // Use useFieldArray to handle the array of itinerary items
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  // Add a new empty itinerary item
  const addItem = () => {
    append({
      startTime: "",
      endTime: "",
      description: ""
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t('eventSchedule')}
        </h3>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={addItem}
          className="text-xs flex items-center gap-1"
        >
          <Plus className="h-3 w-3" />
          {t('addItem')}
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-foreground/60">
          {t('noScheduleItems')}
        </p>
      )}

      {fields.map((field, index) => (
        <div key={field.id} className="p-4 bg-white/5 rounded-lg space-y-3 relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 text-foreground/60 hover:text-foreground"
            onClick={() => remove(index)}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`${name}.${index}.startTime`} className="text-xs text-foreground/60">
                {t('startTime')}
              </Label>
              <Input
                id={`${name}.${index}.startTime`}
                {...register(`${name}.${index}.startTime`)}
                type="time"
                className="bg-black/20 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${name}.${index}.endTime`} className="text-xs text-foreground/60">
                {t('endTime')}
              </Label>
              <Input
                id={`${name}.${index}.endTime`}
                {...register(`${name}.${index}.endTime`)}
                type="time"
                className="bg-black/20 border-white/10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${name}.${index}.description`} className="text-xs text-foreground/60">
              {t('description')}
            </Label>
            <Textarea
              id={`${name}.${index}.description`}
              {...register(`${name}.${index}.description`)}
              placeholder="Describe this part of the event..."
              className="bg-black/20 border-white/10 min-h-[80px]"
            />
          </div>
        </div>
      ))}
      
      {fields.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          className="w-full text-xs flex items-center gap-1 mt-2"
        >
          <Plus className="h-3 w-3" />
          {t('addAnotherItem')}
        </Button>
      )}
    </div>
  );
}