import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { sizeVehicles } from "@/domain/gamedata/vehicles";
import { formatQty } from "./formatters";

const NUMBER_INPUT_CLASS =
  "w-20 rounded-[var(--radius)] border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface Props {
  readonly rate: number;
  readonly stackSize: number;
  readonly isFluid: boolean;
}

/** Renders the vehicle sizing estimate panel (round trip time, train cars, throughput table). */
export default function VehiclePanel({ rate, stackSize, isFluid }: Props) {
  const { t } = useTranslation();
  const [roundTripRaw, setRoundTripRaw] = useState("5");
  const [carsRaw, setCarsRaw] = useState("1");

  const roundTrip = Number.parseFloat(roundTripRaw);
  const cars = Math.max(1, Math.floor(Number.parseInt(carsRaw, 10) || 1));
  const validRoundTrip = Number.isFinite(roundTrip) && roundTrip > 0;

  const sizing = useMemo(
    () => (validRoundTrip ? sizeVehicles(rate, stackSize, roundTrip, isFluid, cars) : []),
    [rate, stackSize, roundTrip, isFluid, cars, validRoundTrip],
  );

  const unit = isFluid ? "m³/min" : "/min";

  return (
    <section className="rounded-[var(--radius)] border border-border bg-card p-4">
      <h2 className="mb-2 text-sm font-semibold text-foreground">{t("calculator.vehicles_title")}</h2>
      <div className="mb-2 flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="veh-rtt" className="text-xs text-muted-foreground">
            {t("calculator.round_trip")}
          </label>
          <input
            id="veh-rtt"
            type="number"
            min="0.1"
            step="any"
            value={roundTripRaw}
            onChange={(e) => {
              setRoundTripRaw(e.target.value);
            }}
            className={NUMBER_INPUT_CLASS}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="veh-cars" className="text-xs text-muted-foreground">
            {t("calculator.train_cars")}
          </label>
          <input
            id="veh-cars"
            type="number"
            min="1"
            step="1"
            value={carsRaw}
            onChange={(e) => {
              setCarsRaw(e.target.value);
            }}
            className={NUMBER_INPUT_CLASS}
          />
        </div>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">{t("calculator.vehicles_estimate_note")}</p>

      {validRoundTrip && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="py-1 font-medium">{t("calculator.col_vehicle")}</th>
              <th className="py-1 font-medium">{t("calculator.col_throughput")}</th>
              <th className="py-1 font-medium">{t("calculator.col_needed")}</th>
            </tr>
          </thead>
          <tbody>
            {sizing.map((v) => (
              <tr key={v.kind} className="border-b border-border">
                <td className="py-1 text-foreground">{t(`calculator.vehicle_${v.kind}`)}</td>
                <td className="py-1 font-mono text-muted-foreground">
                  {v.perVehiclePerMin === null ? "—" : `${formatQty(v.perVehiclePerMin)} ${unit}`}
                </td>
                <td className="py-1 font-mono text-muted-foreground">
                  {v.vehiclesNeeded === null ? t("calculator.vehicles_na") : `×${v.vehiclesNeeded}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
