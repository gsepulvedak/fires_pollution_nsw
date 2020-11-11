library(sf)
library(tidyverse)
library(lubridate)
library(geojsonsf)


# firefreq data ---------------------
# Read bushfires data
fires <- st_read("/home/gon/Documents/Master/sem4/FIT5147_DataViz/project/data/qgis/bushfires_data.gpkg")

# Eliminating "fires" with burnt area less than 10m2 and duration > 1 day
fires_to_del <- fires %>% filter(AreaHa*10000 < 10, Duration > 1) %>% pull(FireName)
fires_clean <-fires %>% filter(FireName != fires_to_del) # 443 fires left (only 1 eliminated)

# Imputing mean of closest neighbours (in burnt area and space) (4 days rounded)
fires_clean <- fires_clean %>% 
  mutate(Duration = ifelse(FireName == "Indigo", 3.5, Duration)) %>% 
  mutate(EndDate = ifelse(FireName == "Indigo", ymd("2019-11-29"), EndDate)) %>% 
  mutate(EndDate = as_date(EndDate))

# Duration imputation of important (big) fires (from press articles analysis)
fires_clean <- fires_clean %>% 
  mutate(EndDate = ifelse(FireName == "Kingsgate, Red Range", ymd("2019-10-12"), EndDate)) %>% 
  mutate(EndDate = ifelse(FireName == "Wandsworth", ymd("2019-11-15"), EndDate)) %>% 
  mutate(EndDate = ifelse(FireName == "Kangawalla", ymd("2019-11-09"), EndDate)) %>% 
  mutate(EndDate = ifelse(FireName == "Kaputar Fire", ymd("2019-11-04"), EndDate)) %>% 
  mutate(EndDate = ifelse(FireName == "Moggs Swamp", ymd("2019-12-15"), EndDate)) %>% 
  mutate(EndDate = ifelse(FireName == "Andersons Creek", ymd("2019-12-21"), EndDate)) %>% 
  mutate(EndDate = ifelse(FireName == "Pearson Trail Complex, Dungowan", ymd("2020-01-06"), EndDate)) %>% 
  mutate(EndDate = ifelse(FireName == "Mount Youngal", ymd("2020-01-23"), EndDate)) %>% 
  mutate(EndDate = as_date(EndDate))

# Recompute duration of fires with new end date
fires_clean <- fires_clean %>% 
  mutate(Duration = as.integer(fires_clean$EndDate - fires_clean$StartDate))

# Imputing mean of duration of fires with AreaHa between 1000 and 2000 Ha
fires_clean <- fires_clean %>% 
  mutate(Duration = ifelse((AreaHa > 1000 & AreaHa < 2000 & Duration < 0), 21.6, Duration))

# Same for fires with Area between 2000 and 9000
fires_clean <- fires_clean %>% 
  mutate(Duration = ifelse((AreaHa > 2000 & AreaHa < 9500 & Duration < 0), 31.7, Duration))

# Replacing true nulls by NAs
fires_clean <- fires_clean %>% 
  mutate(Duration = ifelse(Duration < 0, NA, Duration)) %>% 
  mutate(EndDate = as_date(ifelse(EndDate < 2019, NA, EndDate)))


# Helper function to do window counting
window_count <- function(start_date){
  active <- fires_clean %>% 
    st_drop_geometry() %>%
    group_by(StartDate) %>% 
    filter(StartDate <= start_date, EndDate >= start_date) %>% 
    nrow()
  return(active)
}

# Vectorize window count
vw <- Vectorize(window_count)

# Add active fires to fires_clean
fires_with_actives <- fires_clean %>% 
  mutate(active_fires = vw(fires_clean$StartDate))

# firefreq per day df
firefreq <- fires_with_actives %>% 
  st_drop_geometry() %>% 
  group_by(StartDate) %>%
  summarise(dayFreq = n())

# firefreq source df
# firefreq <- inner_join(firefreq, active_fires)

# Period span dataframe
fire_season <- tibble(date = seq(ymd("2019-07-01"), ymd("2020-05-03"), by = "1 day"))

# generate df for visualisation
firesFreq <- left_join(fire_season, firefreq, by = c("date" = "StartDate")) %>% 
  mutate(dayFreq = ifelse(is.na(dayFreq), 0, dayFreq))

firesFreq <- firesFreq %>% mutate(active_fires = vw(firesFreq$date))

# Clean memory
rm(fires, active_fires)

# Save to csv
# write_csv(firesFreq, "data/firesFreq.csv")

# create fires geoJSON
firespoly <- sf_geojson(fires_clean)

# save to file
write_lines(firespoly, "data/firespoly.json")

# burnt area data ----------------------------
burnt_area <- fires_clean %>% st_drop_geometry() %>%  
  group_by(StartDate) %>% summarise(area = sum(AreaHa))

burnt_area <- left_join(fire_season, burnt_area, by = c("date" = "StartDate")) %>% 
  mutate(area = ifelse(is.na(area), 0, area))

# Save to csv
write_csv(burnt_area, "data/burntarea.csv")


# aqplot data --------------------------------------------

# read original
aq <- read_csv("/home/gon/Documents/Master/sem4/FIT5147_DataViz/project/data/DailyPoll_NSW_2019_2020_FireSeason.csv", col_types = "dcdddddddddd")
aq$Date <- dmy(aq$Date) # parse character dates
station <- read_csv("/home/gon/Documents/Master/sem4/FIT5147_DataViz/project/data/NSW Site Details.csv" , col_types = "dcddc")

# group by latitude
aq_coord <- aq %>% inner_join(station, by = "Site_Id")
aq_sites <- aq_coord %>% mutate(lat_group = factor(cut(Latitude, breaks = 4, labels = FALSE), levels = c(4,3,2,1)))
aq_sites_group <- aq_sites %>% group_by(Date, lat_group) %>% 
  summarise(tot_PM10 = sum(PM10, na.rm = TRUE), tot_PM2.5 = sum(PM2.5, na.rm = TRUE)) %>% 
  inner_join(aq_sites %>% group_by(lat_group) %>% summarise(site_count = n_distinct(Site_Id))) %>% 
  mutate(avg_PM10 = tot_PM10/site_count) %>% 
  mutate(avg_PM25 = tot_PM2.5/site_count)

# generate aqplot
aqplot <- aq_sites_group %>% 
  select(Date, lat_group, PM10 = avg_PM10, PM25 = avg_PM25)  %>% 
  filter(Date <= "2020-05-03") %>% 
  pivot_longer(starts_with("PM"), names_to = "param")

# Save to csv
# write_csv(aqplot, "data/aqplot.csv")
