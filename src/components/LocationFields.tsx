import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Constants } from "@/integrations/supabase/types";
import { useCountries, useCountryCities } from "@/lib/location";

const sanitizeCity = (v: string) => v.replace(/[^A-Za-zÀ-ÿ\s'-]/g, "");

interface Props {
  countryCode: string;
  onCountryChange: (code: string) => void;
  city: string;
  onCityChange: (city: string) => void;
  state: string;
  onStateChange: (state: string) => void;
  cityMax?: number;
  disabled?: boolean;
}

export function LocationFields({
  countryCode, onCountryChange, city, onCityChange, state, onStateChange, cityMax = 100, disabled,
}: Props) {
  const countries = useCountries();
  const cities = useCountryCities(countryCode);
  const [open, setOpen] = useState(false);
  const isBR = (countryCode || "BR") === "BR";

  return (
    <>
      <div className="space-y-2">
        <Label>País <span className="text-destructive">*</span></Label>
        <Select value={countryCode || "BR"} onValueChange={c => { onCountryChange(c); onCityChange(""); if (c !== "BR") onStateChange(""); }} disabled={disabled}>
          <SelectTrigger><SelectValue placeholder="Selecione o país..." /></SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {countries.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isBR ? (
        <>
          <div className="space-y-2">
            <Label>Cidade <span className="text-destructive">*</span></Label>
            <Input
              value={city}
              onChange={e => onCityChange(sanitizeCity(e.target.value))}
              placeholder="Ex.: São Paulo"
              maxLength={cityMax}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>Estado <span className="text-destructive">*</span></Label>
            <Select value={state || undefined} onValueChange={onStateChange} disabled={disabled}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {Constants.public.Enums.brazilian_state.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </>
      ) : (
        <div className="space-y-2 sm:col-span-2">
          <Label>Cidade <span className="text-destructive">*</span></Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                disabled={disabled}
                className={cn("w-full justify-between font-normal", !city && "text-muted-foreground")}
              >
                {city || "Selecione ou digite a cidade..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar cidade..." />
                <CommandList>
                  <CommandEmpty className="py-3 px-3 text-sm text-muted-foreground">
                    Nenhuma cidade encontrada nesta lista.
                  </CommandEmpty>
                  <CommandGroup>
                    {cities.map(c => (
                      <CommandItem
                        key={c.id}
                        value={c.name}
                        onSelect={() => { onCityChange(c.name); setOpen(false); }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", city === c.name ? "opacity-100" : "opacity-0")} />
                        {c.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </>
  );
}
