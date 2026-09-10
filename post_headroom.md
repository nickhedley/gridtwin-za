# South Africa's wind problem is not the wind

*Draft for LinkedIn. Every figure below is arithmetic on published data - NTCSA's Grid
Connection Capacity Assessment and the IPP Office quarterly. Nothing here depends on a
dispatch model.*

---

There has been good discussion lately about where South Africa's wind is, and about the
fourth dimension - not just how much wind a site has, but *when* it blows. That work
matters. But there is a fifth dimension that decides whether any of it becomes a project,
and it points the opposite way.

I put connection headroom next to wind resource quality for all ten supply areas. Ten
Twelve weather years of MERRA-2 for the resource, sampled at up to twelve sites per
region and calibrated against Eskom's metered output. NTCSA's published GCCA for
the headroom.

```
region            wind CF     connection headroom
Hydra Central      41.3%                   0 MW
Northern Cape      39.9%                   0 MW
Eastern Cape       36.3%                 400 MW
Western Cape       33.8%               1,180 MW
KwaZulu-Natal      32.8%              16,500 MW
Free State         31.4%               4,260 MW
North West         29.9%               4,980 MW
Mpumalanga         24.9%               9,960 MW
Gauteng            23.0%              14,040 MW
Limpopo            21.9%              10,080 MW
```

**The correlation between wind quality and available grid is -0.72.**

Read that column pair again. The two best wind resources in the country - Hydra Central at
41.3% and the Northern Cape at 39.9% - have **zero** headroom. Not "constrained". Zero,
for wind, for solar, and for batteries.

The four best-resource regions hold **100% of South Africa's existing wind fleet** and
**2.6% of the room to add more**. The four worst hold 64%.

## What this means in practice

A developer can run a perfect prospecting study. They can find a site with a 38% capacity
factor, confirm the wind blows at night when their industrial offtaker needs it, and model
a hybrid that barely needs a battery. And then discover there is no connection, and none
scheduled.

That is not a resource problem or a cost problem. Both of those are solved. It is a
sequencing problem: **we have been optimising the layer that isn't binding.**

## The uncomfortable part, and the one exception

The headroom that does exist is mostly in Gauteng, Mpumalanga and Limpopo - the demand
centres and the coal provinces. There is grid there because there are power stations there,
and load. Building 14,040 MW of wind in Gauteng at 23.0% is a genuinely worse project than
400 MW in the Eastern Cape at 36.3%.

**KwaZulu-Natal is the exception, and it is a large one.** 32.8% capacity factor, fifth of
ten on resource, and 16,500 MW of headroom - more than any other supply area. It is better
than the Western Cape on resource within a point, and has fourteen times the room.

That is not a trade-off. It is the one place where the resource is good enough and the grid
is already there, and it holds more available capacity than the rest of the country
combined outside the coal belt.

I would not have written that sentence a month ago. My own regional wind profiles put
KwaZulu-Natal at 20.5% until I rebuilt them from multiple sites per region rather than one
point. A single centroid in a province with a coastal strip, a midlands escarpment and a
dry interior is not a province. Correcting it moved KwaZulu-Natal twelve points, and turned
it from the worst example in this argument into the best counter to it.

For the rest of the country the trade still stands - worse resource where the grid is, or
better resource and a wait of unknown length. That is the decision the sector is actually
making right now, and it is rarely framed that way.

## What I think follows

**Transmission build sequencing is the binding decision in South African renewables, not
procurement rounds and not technology cost.** If the next bid window fills with projects in
regions at zero headroom, the constraint bites regardless of how well those projects were
sited or how cheaply they bid.

I model this openly at gridtwinza.org - the code and the data are public, and the headroom
figures come straight from NTCSA's published assessment, so anyone can check the table
above rather than take my word for it.

If I have the grid data wrong, I would genuinely like to know.

---

**Caveats, stated rather than buried:** headroom is from the GCCA 2025 plus the October
2025 curtailment update, so it is a snapshot and NTCSA revises it. Capacity factors are
modelled at capacity-weighted plant locations rather than measured at hub height, so treat
them as a ranking rather than a bankable number. And headroom is not a hard wall - grid-
enhancing technologies, curtailment agreements and network upgrades all move it. What does
not move is the ordering.
